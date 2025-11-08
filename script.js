// 1. Initialize Supabase
// PASTE YOUR SUPABASE PROJECT URL AND ANON KEY HERE
const supabaseUrl = 'https://bdarbfivfvdkqmbunhmn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkYXJiZml2ZnZka3FtYnVuaG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDc5OTcsImV4cCI6MjA3ODE4Mzk5N30.xuZbNs6NpqjcBl16kFOIjpgloXSfSazELaBFAH4-S00';

// Create a single Supabase client for interacting with your database.
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// --- Notification Logic ---
const notification = document.getElementById('notification');
let notificationTimeout; // To hold the timeout ID

function showNotification(message, type) {
    // Clear any existing timeout to prevent stacking/overlapping
    clearTimeout(notificationTimeout);

    notification.textContent = message;
    notification.className = `notification show ${type}`; // e.g., 'error' or 'success'

    notificationTimeout = setTimeout(() => {
        notification.className = 'notification';
    }, 3000);
}

// --- Reservation Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const reserveButtons = document.querySelectorAll('.reserve-btn');

    // Fetch the initial reservation status for all items on the page
    checkInitialReservationStatus();

    reserveButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const card = event.target.closest('.card');
            const itemId = card.dataset.id;

            if (!itemId) {
                console.error('Card is missing a data-id attribute!');
                return;
            }

            await reserveItem(itemId, button);
        });
    });
});

async function checkInitialReservationStatus() {
    const cards = document.querySelectorAll('.card[data-id]');
    if (cards.length === 0) return;

    // Collect all item IDs from the DOM
    const itemIds = Array.from(cards).map(card => card.dataset.id);

    try {
        // Fetch the status for all items in a single query
        const { data, error } = await _supabase
            .from('wishlist_items')
            .select('id, is_reserved')
            .in('id', itemIds);

        if (error) throw error;

        // Update the UI for each reserved item
        data.forEach(item => {
            if (item.is_reserved) {
                const card = document.querySelector(`.card[data-id="${item.id}"]`);
                if (card) {
                    const button = card.querySelector('.reserve-btn');
                    button.textContent = 'Reserved';
                    button.disabled = true;
                }
            }
        });
    } catch (error) {
        console.error('Error fetching initial reservation status:', error.message);
    }
}

async function reserveItem(itemId, button) {
    try {
        // Call the database function 'reserve_wishlist_item' we created in Supabase
        const { data, error } = await _supabase.rpc('reserve_wishlist_item', {
            item_id_to_reserve: itemId
        });

        if (error) {
            // If the RPC call itself fails
            throw new Error('An unexpected error occurred. Please try again.');
        }
        
        if (data === 'SUCCESS') {
            // If the function returns 'SUCCESS'
            showNotification('Item successfully reserved!', 'success');
            button.textContent = 'Reserved';
            button.disabled = true;
        } else if (data === 'ALREADY_RESERVED') {
            // If the function returns 'ALREADY_RESERVED'
            throw new Error('This item has already been reserved.');
        }
    } catch (error) {
        showNotification(error.message, 'error');
        console.error("Reservation failed: ", error.message);
    }
}