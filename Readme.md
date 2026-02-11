==============================================================================
ABHAYA SAFETY APP - TEAM SETUP & CONTRIBUTION GUIDE
==============================================================================

Welcome to the Abhaya Safety App project! 
Follow these instructions strictly to set up the project and contribute code.

---
PART 1: INSTALLATION & SETUP (DO THIS FIRST)
---

[A] PREREQUISITES
Make sure you have installed:
1. Node.js (Latest LTS) - https://nodejs.org/
2. Python (3.9 or newer) - https://www.python.org/
3. Git - https://git-scm.com/
4. Expo Go App (On your mobile phone)
5. VS Code (Recommended Editor)

[B] CLONE THE REPOSITORY
Open your terminal (PowerShell or Command Prompt) and run:
   git clone https://github.com/jyotiradityaparida25/abhaya-safety-app.git
   cd abhaya-safety-app

[C] BACKEND SETUP (The Brain)
1. Open a terminal inside the 'backend' folder:
   cd backend

2. Create a virtual environment (Recommended):
   python -m venv venv

3. Activate the virtual environment:
   (Windows): venv\Scripts\activate
   (Mac/Linux): source venv/bin/activate

4. Install dependencies:
   pip install fastapi uvicorn osmnx networkx scikit-learn requests

5. Start the Server:
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload

   *NOTE: The first run will take 1-2 minutes to download the city map.
   Wait until you see "Application startup complete".

[D] FRONTEND SETUP (The App)
1. Open a NEW terminal window inside the 'safety-app' folder:
   cd safety-app

2. Install dependencies:
   npm install

3. Start the App:
   npx expo start --clear

4. Connect your Phone:
   - Ensure your Phone and Laptop are on the SAME Wi-Fi or Hotspot.
   - Scan the QR code with the Expo Go app.

5. Update IP Address (CRITICAL STEP):
   - Find your laptop's IP address (Run 'ipconfig' in terminal).
   - Open the file: app/(tabs)/index.tsx
   - Find: const LAPTOP_IP = '...';
   - Change it to YOUR laptop's IP.

---
PART 2: GIT WORKFLOW (HOW TO CONTRIBUTE)
---

** CRITICAL RULE **
DO NOT push directly to the 'main' branch. It is protected. 
You must use a separate branch for your work.

STEP 1: GET LATEST CODE
   git checkout main
   git pull origin main

STEP 2: CREATE A NEW BRANCH
   Name your branch based on what you are doing (e.g., login-ui, fix-map).
   git checkout -b feature-your-branch-name

STEP 3: WORK & SAVE
   Write your code in VS Code. Save your files.

STEP 4: PUSH CHANGES
   git add .
   git commit -m "Description of what you added"
   git push origin feature-your-branch-name

STEP 5: SUBMIT
   Go to the GitHub repository page.
   Click "Compare & pull request".
   Create the Pull Request and wait for approval.

---
PART 3: TROUBLESHOOTING
---

1. "Network Error" or App won't connect?
   - Check if Phone and Laptop are on the same network.
   - Check if 'LAPTOP_IP' in index.tsx matches your current IP.
   - Turn off Windows Firewall temporarily.

2. Map is blank or Backend crashing?
   - Delete the 'bhubaneswar.graphml' file in the backend folder and restart the server to redownload the map.

3. "Permission denied" when pushing?
   - You are likely trying to push to 'main'. Switch to your own branch.

==============================================================================
HAPPY CODING! LET'S WIN THIS!
==============================================================================