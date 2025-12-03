
## Project Overview

TigerTix is an accessible event ticketing platform designed to improve the booking process through multi-modal interaction. TigerTix integrates Large Language Models (LLM) and Voice Input capabilities, allowing users to search for events and book tickets using natural language.

The system is built with a focus on accessibility, data integrity, and concurrency management, ensuring a robust experience even during high-demand ticket releases.

## Tech Stack
# Frontend
    * Framework: React 
    * Styling: CSS Modules & Global CSS
    * Testing: React Testing Library, Jest, Playwright
    * Key Features: Voice Recognition (Web Speech API), Real-time Chat Interface

# Backend 
    * Runtime: Node.js
    * Framework: Express.js
    * Database: SQLite (Shared instance)
    * AI/ML: Custom LLM Integration (Prompt Engineering for Booking Logic)
    * Architecture: Service-Oriented Architecture (SOA) with Distributed Monolith characteristic

## Architecture Summary
TigerTix utilizes a Service-Oriented Architecture where unique functions are separated into specific services. However,all services share a single SQLite database instance to simplify data consistency

# Core Services
    * User Authentication Service: Manages user registration, login, and session security.
    * Admin Service: Handles system administration, including event creation and management. It also handles the initial database setup.
    * Client Service: The primary interface for standard user operations (viewing events, fetching details, standard booking).
    * LLM Driven Booking Service: A specialized service that parses natural language inputs (text or voice transcripts) to execute complex booking intents autonomously.

# Data Flow & Concurrency
A critical component of the architecture is the Queue Service. To prevent race conditions (e.g., double-booking the final ticket), booking requests are serialized through a queue before interacting with the shared database.

## Installation & Setup Instructions

# Prerequisites
    * Node.js (v14+ recommended)
    * npm (Node Package Manager)

# 1. Clone the Repository
```bash
git clone https://github.com/DreadGod96/CPSC3720TigerTix.git
cd CPSC3720TigerTix/TigerTix
```

# 2. Database Initialization
The database must be initialized before starting the services. The Admin service contains the setup script.
```bash
cd backend/admin-service
node setup.js
```
*This script will create the database.sqlite file in the shared-db directory and populate it with initial tables.*

# 3. Install Dependencies
You need to install dependencies for the root, frontend, and backend root.

# Frontend:
```bash
cd ../../frontend
npm install
```

# Backend:
```bash
cd ../backend/
npm install
```

# 4. Environment Variables Setup
The **LLM Driven Booking Service** requires an API key to function.
1. Navigate to `backend/llm-driven-booking/`.
2. Create a file named `.env` (if it doesn't exist).
3. Add your API key:
```bash
LLM_API_KEY=your_api_key_here
```
*Note: Ensure you do not commit your actual API keys to version control.*

# 5. Start the Application
You will need to run the backend services and the frontend concurrently. You can use separate terminal tabs or the below:
```bash
cd ./backend
npm run start
```
*The start script will run each service's `server.js` in parallel*

## How to Run Regression Tests
TigerTix employs a three-layer testing strategy.

# 1. Unit & Integration Tests
Run these to verify individual components and logic.
```bash
# All frontend tests
cd frontend
npm test

# All backend tests
cd backend
npm test

# Specific service tests (Example for Client Service)
cd backend/client-service
npm test
```
# 2. Concurrency Tests
These tests simulate high-traffic scenarios to ensure the Queue Service prevents overbooking.
```bash
cd backend/client-service
npm run test:concurrency
# Or specifically: npx jest controllers/clientController.concurrency.test.js
```

# 3. End-to-End (E2E) Tests
These tests validate the entire application flow.
```bash
cd frontend
npm run test:e2e
```

## Team Members
| Name                | Role               |
| ------------------- | ------------------ |
| Caden Allen         | Technical Lead     |
| Roman Pasqualone    | Fullstack Engineer |
| Eli Monroe          | Fullstack Engineer |
| Dr. Julian Brinkley | Instructor         |
| Colt Doster         | Teaching Assistant |
| Atik Enam           | Teaching Assistant |

## License
This project is licensed under the MIT License.

## Demo Video
[Link to Demo Video](https://youtu.be/lW_I9dk4rL8)