// Supabase Configuration
const SUPABASE_URL = 'https://ihjkbjntjuctpdsccuxg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloamtiam50anVjdHBkc2NjdXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTkxNTMsImV4cCI6MjA3NzY3NTE1M30.8SIyvNFL26lxSresSmTZikTfpKtanZPAl252RuCEux0';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let currentUser = null;

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
function showApp() {
    nameScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    currentUserName.textContent = currentUser;
    loadNotes();
    subscribeToNotes();
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

    notesList.innerHTML = notes.map(note => `
        <div class="note-card" data-note-id="${note.id}">
            <div class="note-header">
                <span class="note-author">${escapeHtml(note.author || 'Anonymous')}</span>
                <span class="note-time">${formatDate(note.created_at)}</span>
            </div>
            <div class="note-content">${escapeHtml(note.content)}</div>
            <div class="note-actions">
                <button class="btn-delete" onclick="deleteNote('${note.id}')">Delete</button>
            </div>
        </div>
    `).join('');
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
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            console.error('Insert error:', error);
            throw error;
        }

        noteInput.value = '';
        console.log('Note added successfully:', data);
        // Note will be added via real-time subscription
    } catch (error) {
        console.error('Error adding note:', error);
        alert(`Failed to add note: ${error.message}`);
    }
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

// Subscribe to real-time changes
function subscribeToNotes() {
    supabase
        .channel('notes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'notes' },
            (payload) => {
                console.log('Change received!', payload);
                loadNotes(); // Reload all notes when any change occurs
            }
        )
        .subscribe();
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
