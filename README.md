# Meta-Drip: The Virtual AR Shopping Assistant

> "Try Before You Buy, Virtually"

-----

### 🌟 Project Overview

Meta Drip is an Augmented Reality (AR) application designed to **revolutionize online accessory shopping** by eliminating customer hesitation and reducing returns. It achieves this by offering a **Live Virtual Try-On** experience where users can instantly preview products like eyeglasses and sunglasses on their face using their device's camera. The entire application is built using a modern stack focused on performance and seamless user experience.

### ✨ Key Features

The core functionality and features that define the Meta Drip experience include:

  * **Live AR Try-On:** Instantly overlays accessories onto the user's live video feed using the MediaPipe Face Mesh model.
  * **Stable Facial Tracking:** Employs advanced computer vision to ensure accessory overlays **move naturally** with the user's head, maintaining accurate positioning, scaling, and rotation in real-time.
  * **Customer Reviews & Rating:** Users can submit ratings and comments on products, contributing to community-driven review statistics shown on the product detail page.
  * **Personalized Wishlist:** Allows authenticated users (via Clerk) to add and remove products to a persistent wishlist.
  * **Secure Admin Panel:** A protected dashboard for administrators to view, create, delete, and update products in the catalog.
  * **Integrated Shopping Links:** Product pages link directly to major e-commerce platforms (Amazon, Flipkart, Myntra, etc.) for easy purchasing.

-----

### 💻 Tech Stack

The project is divided into a modern React/TypeScript frontend and a Node.js/Express backend, connected by REST APIs.

#### Frontend

| Technology | Description |
| :--- | :--- |
| **REACT.js** | Main application framework (in TypeScript). |
| **Vite** | Fast build tool and development server. |
| **Tailwind CSS** | Utility-first styling, providing custom styles like `glass` and `gradient-text`. |
| **framer-motion** | For smooth animations and interactive user interface elements. |
| **Clerk** | Full-featured user authentication and authorization. |
| **@tanstack/react-query** | Data fetching, caching, and state synchronization. |

#### Backend & AR Core

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend API** | **Node.js/Express** | REST API for handling data requests for products, wishlists, and reviews. |
| **Database** | **MongoDB** | Stores product metadata and base64-encoded AR overlay images. |
| **AR Engine** | **MediaPipe Face Mesh**| Computer Vision library for real-time facial landmark detection, running directly on the client. |
| **Media Access** | **WebRTC & HTML Canvas** | Used for accessing the device camera and rendering the augmented reality overlay. |

-----

### 🚀 Installation & Setup

You will need a MongoDB instance and a Clerk account for the application to run correctly.

#### 1\. Prerequisites

  * Node.js (LTS version recommended)
  * npm or Yarn
  * A MongoDB connection string (`MONGODB_URI`)
  * A Clerk Publishable Key (`VITE_CLERK_PUBLISHABLE_KEY`)

#### 2\. Backend Setup (API)

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create a .env file and add your configuration
# Replace placeholders with your actual values
touch .env
echo "MONGODB_URI=\"<YOUR_MONGODB_CONNECTION_STRING>\"" >> .env
echo "PORT=5000" >> .env
echo "ADMIN_USERNAME=\"<YOUR_ADMIN_USERNAME>\"" >> .env
echo "ADMIN_PASSWORD=\"<YOUR_ADMIN_PASSWORD>\"" >> .env

# Start the backend server (with file watching enabled)
npm run dev
```

#### 3\. Frontend Setup (Web App)

```bash
# Navigate to the Frontend directory
cd Frontend

# Install dependencies
npm install

# Create a .env file and add your Clerk Publishable Key
# Replace the placeholder with your actual key
touch .env
echo "VITE_CLERK_PUBLISHABLE_KEY=\"<YOUR_CLERK_PUBLISHABLE_KEY>\"" >> .env

# Start the frontend development server
npm run dev
```

The application will be available in your browser (e.g., `http://localhost:5173`).

-----

### 👥 Team

This project was built by **Team 404 Found** for HackEnergy 1.0.

  * **Ayush Kumar** (2nd Year Btech CSE, M.A.I.T)
  * **Amritesh Kumar Rai** (2nd Year Btech CSE, M.A.I.T)
  * **Kaustubh Sharma** (2nd Year Btech CSE, M.A.I.T)
  * **Himanshu Kumar Mahto** (2nd Year Btech CSE, M.A.I.T)
