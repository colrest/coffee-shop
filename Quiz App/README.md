# Quiz Application

## Project Title
**Quiz Application** — a multiple-choice quiz built with plain HTML, CSS, and JavaScript.

## Objective
The goal of this project is to build a simple, beginner-friendly quiz application
that runs entirely in the browser. It demonstrates core front-end skills:
displaying questions one at a time, handling user clicks, calculating a score,
running a countdown timer, and showing a final results screen. No frameworks,
libraries, or build tools are used — the whole app runs by opening one HTML file.

## Technologies Used
- **HTML5** — to build the structure of the page.
- **CSS3** — to style the page and make it responsive and clean.
- **Vanilla JavaScript** — to add all the interactivity (no frameworks or libraries).

## Features Implemented
1. **Multiple-choice questions** — questions are shown one at a time, each with 4 options.
2. **Score calculation** — the app tracks how many questions were answered correctly.
3. **Countdown timer** — each question has a 15-second timer; when it reaches zero the
   app automatically moves to the next question.
4. **Answer highlighting** — clicking an option locks the answer, highlights the correct
   option in green and a wrong choice in red, then advances.
5. **Results screen** — shows the final score, the percentage, and a pass/fail message
   (50% or higher is a pass).
6. **Restart button** — lets the user take the quiz again from the beginning.
7. **Review Answers screen (individual enhancement)** — lists every question with the
   answer the user picked and the correct answer, so mistakes can be reviewed.
8. **Basic error handling** — guards against an empty questions array and prevents
   clicking a second option after an answer is locked.

## Steps to Run the Application
1. Download or copy the project folder onto your computer.
2. Make sure these three files are in the same folder:
   - `index.html`
   - `style.css`
   - `script.js`
3. Double-click `index.html` (or right-click and choose "Open with" your web browser).
4. The quiz opens in the browser. Click **Start Quiz** to begin.

No installation, internet connection, or extra software is required.

## Project Structure
```
Quiz App/
├── index.html   (the page structure and the four screens)
├── style.css    (all the styling and the responsive layout)
├── script.js    (all the quiz logic and interactivity)
└── README.md    (this file)
```
