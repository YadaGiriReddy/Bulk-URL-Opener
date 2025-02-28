const darkModeToggle = document.getElementById('darkModeToggle');

/**
 * Applies the dark theme to the extension container.
 */
function enableDarkMode() {
    extensionContainer.classList.add('dark-theme');
}

/**
 * Removes the dark theme from the extension container.
 */
function disableDarkMode() {
    extensionContainer.classList.remove('dark-theme');
}

/**
 * Toggles the dark mode state when the toggle checkbox is changed.
 */
function toggleDarkMode() {
    if (darkModeToggle.checked) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
}