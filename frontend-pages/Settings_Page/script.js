// Function to handle back button click
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        console.log('No previous page in history');
    }
}

// Function to handle settings navigation
function navigateToSetting(setting) {
    console.log('Navigating to:', setting);
    // You can replace this with actual navigation logic
    // Example: window.location.href = `/settings/${setting}`;
}

// Function to handle appearance toggle
function toggleAppearance() {
    const toggle = document.getElementById('appearanceToggle');
    const isDarkMode = toggle.checked;

    if (isDarkMode) {
        document.body.style.background = '#1a1a1a';
        document.body.style.color = '#fff';
        document.querySelector('.settings-container').style.background = '#2a2a2a';
        document.querySelector('.settings-container').style.color = '#fff';

        document.querySelectorAll('.settings-item').forEach(item => {
            item.style.color = '#fff';
        });

        document.querySelectorAll('.item-title').forEach(title => {
            title.style.color = '#fff';
        });

        localStorage.setItem('darkMode', 'true');
        console.log('Dark mode enabled');
    } else {
        document.body.style.background = 'linear-gradient(135deg, #B8E6F0 0%, #C8F0D4 100%)';
        document.body.style.color = '#000';
        document.querySelector('.settings-container').style.background = '#fff';
        document.querySelector('.settings-container').style.color = '#000';

        document.querySelectorAll('.settings-item').forEach(item => {
            item.style.color = '#000';
        });

        document.querySelectorAll('.item-title').forEach(title => {
            title.style.color = '#000';
        });

        localStorage.setItem('darkMode', 'false');
        console.log('Light mode enabled');
    }
}

// Load dark mode preference on page load
document.addEventListener('DOMContentLoaded', function() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    const toggle = document.getElementById('appearanceToggle');

    if (darkModeEnabled) {
        toggle.checked = true;
        toggleAppearance();
    }

    // Add fade-in animation to settings container
    const container = document.querySelector('.settings-container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';

    setTimeout(() => {
        container.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 100);
});

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        goBack();
    }
});