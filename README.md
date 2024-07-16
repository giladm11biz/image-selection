<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>README</title>
</head>
<body>

<h1>Next.js Project with Vue.js</h1>

<h2>Overview</h2>
<p>This project is a comprehensive web application built with Next.js and Vue.js, designed to manage users and images efficiently. It includes robust user management features, image categorization and manipulation capabilities, error handling via Telegram, and an admin panel using AdminJS.</p>

<h2>Features</h2>

<h3>User Management</h3>
<ul>
    <li><strong>Registration and Login</strong>: Standard user registration and login functionality with access token authentication (refresh token not implemented).</li>
    <li><strong>Google OAuth</strong>: Users can register and log in using their Google accounts.</li>
    <li><strong>Email Verification</strong>: Email verification for new users to activate their accounts.</li>
    <li><strong>Password Reset</strong>: Functionality for users to reset their passwords via email.</li>
</ul>

<h3>Image Management</h3>
<ul>
    <li><strong>Categories</strong>: Images are organized into categories for better management.</li>
    <li><strong>Image Viewing</strong>: Users can view images within their categories.</li>
    <li><strong>Image Cropping</strong>: Users can crop images as needed.</li>
    <li><strong>Approval/Deletion</strong>: Users can approve or delete images.</li>
    <li><strong>Undo</strong>: The application supports undoing the last actions.</li>
    <li><strong>Hotkeys</strong>: Implemented hotkeys for quicker image management.</li>
</ul>

<h3>Error Handling</h3>
<ul>
    <li><strong>Telegram Notifications</strong>: Error handling is integrated with Telegram to send notifications for any errors that occur within the application.</li>
</ul>

<h3>Admin Panel</h3>
<ul>
    <li><strong>AdminJS</strong>: An admin panel built with AdminJS for managing users and images.</li>
</ul>

</body>
</html>
