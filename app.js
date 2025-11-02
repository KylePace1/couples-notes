// Supabase Configuration
const SUPABASE_URL = 'https://ihjkbjntjuctpdsccuxg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloamtiam50anVjdHBkc2NjdXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTkxNTMsImV4cCI6MjA3NzY3NTE1M30.8SIyvNFL26lxSresSmTZikTfpKtanZPAl252RuCEux0';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let currentUser = null;
let userStats = null;

// DOM Elements
const nameScreen = document.getElementById('nameScreen');
const appScreen = document.getElementById('appScreen');
const nameForm = document.getElementById('nameForm');
const nameInput = document.getElementById('nameInput');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const noteForm = document.getElementById('noteForm');
const noteInput = document.getElementById('noteInput');
const notesList = document.getElementById('notesList');
const currentUserName = document.getElementById('currentUserName');
const statsDisplay = document.getElementById('statsDisplay');

// Initialize app
function init() {
    // Check if user name is already saved
    const savedUser = localStorage.getItem('authorName');
    if (savedUser) {
        currentUser = savedUser;
        showApp();
    }

    // Event listeners
    nameForm.addEventListener('submit', handleNameSubmit);
    noteForm.addEventListener('submit', handleAddNote);
}

// Handle name submission
function handleNameSubmit(e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    const password = passwordInput.value;

    if (!name || !password) return;

    // Check password
    if (password !== 'ily') {
        loginError.textContent = 'Wrong password! Try again.';
        return;
    }

    loginError.textContent = '';
    currentUser = name;
    localStorage.setItem('authorName', name);
    showApp();
}

// Show app screen
async function showApp() {
    nameScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    currentUserName.textContent = currentUser;
    await loadUserStats();
    loadNotes();
    subscribeToNotes();
    requestNotificationPermission();
}

// Request notification permission (works on Android/Desktop, not iOS PWA)
async function requestNotificationPermission() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
        if (Notification.permission === 'default') {
            // Wait a bit before asking to not overwhelm user
            setTimeout(async () => {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('Notification permission granted');
                }
            }, 5000); // Ask after 5 seconds
        }
    }
}

// Show local notification (for new notes from partner)
function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    body: body,
                    icon: '/couples-notes/icon-192.png',
                    badge: '/couples-notes/icon-192.png',
                    vibrate: [200, 100, 200],
                    tag: 'new-note',
                    requireInteraction: false
                });
            });
        }
    }
}

// Load user stats
async function loadUserStats() {
    try {
        const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('username', currentUser)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error loading stats:', error);
            return;
        }

        userStats = data || { username: currentUser, total_notes: 0, points: 0, level: 1, total_reactions: 0 };
        displayUserStats();
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

// Display user stats
function displayUserStats() {
    if (!userStats) return;

    const level = userStats.level || 1;
    const points = userStats.points || 0;
    const nextLevelPoints = level * 50;
    const progress = ((points % 50) / 50) * 100;

    statsDisplay.innerHTML = `
        <div class="stats-container">
            <div class="level-badge">Lvl ${level}</div>
            <div class="stats-info">
                <div class="stat-item">
                    <span class="stat-value">${userStats.total_notes || 0}</span>
                    <span class="stat-label">Notes</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${userStats.total_reactions || 0}</span>
                    <span class="stat-label">Reactions</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${points}</span>
                    <span class="stat-label">Points</span>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-label">${points % 50}/50 XP to Level ${level + 1}</div>
        </div>
    `;
}

// Load notes from Supabase
async function loadNotes() {
    try {
        notesList.innerHTML = '<p class="loading">Loading notes...</p>';

        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        displayNotes(data || []);
    } catch (error) {
        console.error('Error loading notes:', error);
        notesList.innerHTML = `<p class="error">Failed to load notes: ${error.message}</p>`;
    }
}

// Display notes in the UI
function displayNotes(notes) {
    if (notes.length === 0) {
        notesList.innerHTML = '<p class="empty-state">No notes yet. Write the first one!</p>';
        return;
    }

    notesList.innerHTML = notes.map(note => {
        const reactions = note.reactions || [];
        const userReacted = reactions.some(r => r.user === currentUser);
        const reactionCount = reactions.length;

        return `
            <div class="note-card" data-note-id="${note.id}">
                <div class="note-header">
                    <span class="note-author">${escapeHtml(note.author || 'Anonymous')}</span>
                    <span class="note-time">${formatDate(note.created_at)}</span>
                </div>
                <div class="note-content">${escapeHtml(note.content)}</div>
                <div class="note-actions">
                    <button
                        class="btn-react ${userReacted ? 'reacted' : ''}"
                        onclick="toggleReaction('${note.id}')"
                        title="${userReacted ? 'Remove reaction' : 'Add reaction'}"
                    >
                        🐈‍⬛ ${reactionCount > 0 ? reactionCount : ''}
                    </button>
                    <button class="btn-delete" onclick="deleteNote('${note.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Toggle reaction on a note
async function toggleReaction(noteId) {
    try {
        // Get current note
        const { data: note, error: fetchError } = await supabase
            .from('notes')
            .select('reactions')
            .eq('id', noteId)
            .single();

        if (fetchError) throw fetchError;

        let reactions = note.reactions || [];
        const userReactionIndex = reactions.findIndex(r => r.user === currentUser);

        if (userReactionIndex > -1) {
            // Remove reaction
            reactions.splice(userReactionIndex, 1);
        } else {
            // Add reaction
            reactions.push({
                user: currentUser,
                timestamp: new Date().toISOString()
            });

            // Award points for giving a reaction
            await updateUserPoints(5);
        }

        // Update note
        const { error: updateError } = await supabase
            .from('notes')
            .update({ reactions: reactions })
            .eq('id', noteId);

        if (updateError) throw updateError;

        // Reload notes and stats
        await loadNotes();
        await loadUserStats();
    } catch (error) {
        console.error('Error toggling reaction:', error);
        alert(`Failed to react: ${error.message}`);
    }
}

// Update user points
async function updateUserPoints(points) {
    try {
        const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('username', currentUser)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        const currentPoints = (data?.points || 0) + points;
        const newLevel = Math.floor(currentPoints / 50) + 1;
        const totalReactions = (data?.total_reactions || 0) + 1;

        if (data) {
            // Update existing
            await supabase
                .from('user_stats')
                .update({
                    points: currentPoints,
                    level: newLevel,
                    total_reactions: totalReactions
                })
                .eq('username', currentUser);
        } else {
            // Create new
            await supabase
                .from('user_stats')
                .insert({
                    username: currentUser,
                    points: currentPoints,
                    level: newLevel,
                    total_reactions: totalReactions
                });
        }
    } catch (error) {
        console.error('Error updating points:', error);
    }
}

// Add new note
async function handleAddNote(e) {
    e.preventDefault();

    const content = noteInput.value.trim();

    if (!content) return;

    try {
        const { data, error } = await supabase
            .from('notes')
            .insert([
                {
                    content: content,
                    author: currentUser,
                    created_at: new Date().toISOString(),
                    reactions: []
                }
            ])
            .select();

        if (error) {
            console.error('Insert error:', error);
            throw error;
        }

        noteInput.value = '';
        console.log('Note added successfully:', data);

        // Show a little celebration for posting
        showCelebration('📝 +10 points!');

        // Reload notes and stats immediately
        await loadNotes();
        await loadUserStats();
    } catch (error) {
        console.error('Error adding note:', error);
        alert(`Failed to add note: ${error.message}`);
    }
}

// Show celebration message
function showCelebration(message) {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.textContent = message;
    document.body.appendChild(celebration);

    setTimeout(() => {
        celebration.classList.add('show');
    }, 10);

    setTimeout(() => {
        celebration.classList.remove('show');
        setTimeout(() => celebration.remove(), 300);
    }, 2000);
}

// Delete note
async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId);

        if (error) throw error;

        console.log('Note deleted successfully');
        // Refresh notes immediately
        await loadNotes();
    } catch (error) {
        console.error('Error deleting note:', error);
        alert(`Failed to delete note: ${error.message}`);
    }
}

// Subscribe to real-time changes (with fallback polling)
function subscribeToNotes() {
    let realtimeEnabled = false;

    // Try real-time subscription first
    const notesChannel = supabase
        .channel('notes-channel')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'notes' },
            (payload) => {
                console.log('Notes change received!', payload);
                realtimeEnabled = true;

                // Show notification if new note from partner
                if (payload.eventType === 'INSERT' && payload.new.author !== currentUser) {
                    showNotification(
                        `💕 New note from ${payload.new.author}`,
                        payload.new.content.substring(0, 100) + (payload.new.content.length > 100 ? '...' : '')
                    );
                }

                // Reload notes list
                loadNotes();
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Real-time subscription active - updates are instant!');
                realtimeEnabled = true;
            } else if (status === 'CHANNEL_ERROR') {
                console.log('⚠️ Real-time not available - using polling fallback (checks every 5 seconds)');
                startPolling();
            }
        });

    // Subscribe to stats changes
    supabase
        .channel('user-stats-channel')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'user_stats' },
            (payload) => {
                console.log('Stats change received!', payload);
                // Only reload stats if it's for current user
                if (payload.new && payload.new.username === currentUser) {
                    loadUserStats();
                }
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Stats subscription active!');
            }
        });

    // Fallback: Start polling after 3 seconds if realtime isn't working
    setTimeout(() => {
        if (!realtimeEnabled) {
            console.log('⚠️ Starting polling fallback - checking for new notes every 5 seconds');
            startPolling();
        }
    }, 3000);
}

// Polling fallback for when Realtime isn't available
let pollingInterval = null;
let lastNoteId = null;
let pollCount = 0;

async function startPolling() {
    console.log('🔄 startPolling() called');

    // Don't start multiple intervals
    if (pollingInterval) {
        console.log('⚠️ Polling already running, skipping');
        return;
    }

    // Initialize with current latest note
    try {
        const { data } = await supabase
            .from('notes')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            lastNoteId = data[0].id;
            console.log('✅ Initialized with latest note ID:', lastNoteId);
        } else {
            console.log('⚠️ No notes found during initialization');
        }
    } catch (error) {
        console.error('❌ Error initializing polling:', error);
    }

    // Poll every 5 seconds
    pollingInterval = setInterval(async () => {
        pollCount++;
        console.log(`📡 Poll #${pollCount} - Checking for new notes...`);
        console.log(`   Current lastNoteId: ${lastNoteId}`);

        try {
            const { data, error } = await supabase
                .from('notes')
                .select('id, author, content, created_at')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) {
                console.error('❌ Polling error:', error);
                throw error;
            }

            console.log(`   Fetched latest note:`, data);

            // Check if there's a new note
            if (data && data.length > 0) {
                const latestNote = data[0];
                console.log(`   Latest note ID: ${latestNote.id}`);
                console.log(`   Comparing: ${lastNoteId} vs ${latestNote.id}`);

                // New note detected
                if (lastNoteId !== latestNote.id) {
                    console.log('🎉 NEW NOTE DETECTED!', latestNote);
                    console.log(`   Author: ${latestNote.author}, Current user: ${currentUser}`);

                    if (latestNote.author !== currentUser) {
                        console.log('📬 Showing notification for partner note');
                        showNotification(
                            `💕 New note from ${latestNote.author}`,
                            latestNote.content.substring(0, 100) + (latestNote.content.length > 100 ? '...' : '')
                        );
                    } else {
                        console.log('📝 New note is from current user, no notification');
                    }

                    // Update for everyone
                    console.log('🔄 Reloading notes and stats...');
                    await loadNotes();
                    await loadUserStats();
                    lastNoteId = latestNote.id;
                    console.log(`✅ Updated lastNoteId to: ${lastNoteId}`);
                } else {
                    console.log('   No new notes');
                }
            } else {
                console.log('   No notes in database');
            }
        } catch (error) {
            console.error('❌ Polling error:', error);
        }
    }, 5000);

    console.log('📡 Polling started - checking every 5 seconds');
    console.log('💡 Open this console on both devices to see polling activity');
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
}

// Start the app
init();
