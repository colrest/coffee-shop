// ===================================================================
// QUIZ APPLICATION - script.js
// Plain vanilla JavaScript. No frameworks or libraries are used.
// ===================================================================


// ---- 1. THE QUESTIONS ----
// We store all questions in a simple array of objects.
// Each object has the question text, an array of 4 options,
// and "correctAnswer" which is the INDEX (0,1,2,3) of the right option.
var questions = [
  {
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Tech Modern Language",
      "Home Tool Markup Language",
      "Hyperlinks and Text Markup Language"
    ],
    correctAnswer: 0
  },
  {
    question: "Which symbol is used for single-line comments in JavaScript?",
    options: ["<!-- -->", "//", "/* */", "#"],
    correctAnswer: 1
  },
  {
    question: "Which CSS property changes the text color?",
    options: ["font-style", "text-color", "color", "background"],
    correctAnswer: 2
  },
  {
    question: "Inside which HTML element do we put JavaScript?",
    options: ["<js>", "<scripting>", "<javascript>", "<script>"],
    correctAnswer: 3
  },
  {
    question: "What is the result of 2 + 2 in JavaScript?",
    options: ["22", "4", "Error", "Undefined"],
    correctAnswer: 1
  },
  {
    question: "Which method shows a popup message box in the browser?",
    options: ["alert()", "console.log()", "prompt()", "print()"],
    correctAnswer: 0
  },
  {
    question: "Which tag creates a line break in HTML?",
    options: ["<break>", "<lb>", "<br>", "<line>"],
    correctAnswer: 2
  }
];


// ---- 2. SETTINGS AND STATE VARIABLES ----
// How many seconds the user has to answer each question.
var secondsPerQuestion = 15;

// Which question we are currently on (starts at the first one, index 0).
var currentQuestionIndex = 0;

// How many questions the user got right.
var score = 0;

// This will hold the countdown timer so we can stop it later.
var timerId = null;

// How many seconds are left on the current question.
var timeLeft = secondsPerQuestion;

// True while an answer is locked, so the user cannot click twice.
var answerIsLocked = false;

// We save the user's chosen answer index for each question so we can
// show it again on the Review screen. Starts as an empty array.
var userAnswers = [];


// ---- 3. GRAB THE HTML ELEMENTS WE NEED ----
// We find each element by its id once and store it in a variable.
var startScreen = document.getElementById("start-screen");
var quizScreen = document.getElementById("quiz-screen");
var resultsScreen = document.getElementById("results-screen");
var reviewScreen = document.getElementById("review-screen");

var startButton = document.getElementById("start-button");
var restartButton = document.getElementById("restart-button");
var reviewButton = document.getElementById("review-button");
var backToResultsButton = document.getElementById("back-to-results-button");

var questionCounter = document.getElementById("question-counter");
var timerDisplay = document.getElementById("timer");
var questionText = document.getElementById("question-text");
var optionsContainer = document.getElementById("options-container");

var scoreText = document.getElementById("score-text");
var percentageText = document.getElementById("percentage-text");
var passFailText = document.getElementById("pass-fail-text");
var reviewContainer = document.getElementById("review-container");


// ---- 4. CONNECT THE BUTTONS TO THEIR FUNCTIONS ----
// When a button is clicked, run the matching function.
startButton.addEventListener("click", startQuiz);
restartButton.addEventListener("click", startQuiz);
reviewButton.addEventListener("click", showReviewScreen);
backToResultsButton.addEventListener("click", showResultsScreen);


// ---- 5. HELPER FUNCTION: show one screen and hide the others ----
// We add the "hidden" class to every screen, then remove it from
// the single screen we actually want to show.
function showScreen(screenToShow) {
  startScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  resultsScreen.classList.add("hidden");
  reviewScreen.classList.add("hidden");
  screenToShow.classList.remove("hidden");
}


// ---- 6. START (OR RESTART) THE QUIZ ----
// This resets all the numbers back to the beginning and shows
// the first question.
function startQuiz() {
  // Basic error handling: if there are no questions, stop and warn.
  if (questions.length === 0) {
    alert("No questions are available. Please add some questions first.");
    return;
  }

  // Reset everything back to the starting values.
  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];

  // Show the quiz screen and load the first question.
  showScreen(quizScreen);
  showQuestion();
}


// ---- 7. SHOW THE CURRENT QUESTION ----
// This puts the question text and the 4 options onto the screen,
// then starts the countdown timer.
function showQuestion() {
  // A new question means the answer is not locked yet.
  answerIsLocked = false;

  // Get the question object we are currently on.
  var currentQuestion = questions[currentQuestionIndex];

  // Update the "Question X of Y" counter.
  questionCounter.textContent =
    "Question " + (currentQuestionIndex + 1) + " of " + questions.length;

  // Put the question text on the screen.
  questionText.textContent = currentQuestion.question;

  // Clear out any option buttons left over from the previous question.
  optionsContainer.innerHTML = "";

  // Build a button for each option using a simple loop.
  for (var i = 0; i < currentQuestion.options.length; i++) {
    var optionButton = document.createElement("button");
    optionButton.textContent = currentQuestion.options[i];
    optionButton.classList.add("option-button");

    // Remember which option index this button represents.
    optionButton.setAttribute("data-index", i);

    // When this button is clicked, run our checkAnswer function.
    optionButton.addEventListener("click", checkAnswer);

    // Add the finished button into the page.
    optionsContainer.appendChild(optionButton);
  }

  // Start the countdown for this question.
  startTimer();
}


// ---- 8. THE COUNTDOWN TIMER ----
// This counts down from secondsPerQuestion to zero. When it hits
// zero we automatically move on to the next question.
function startTimer() {
  // Reset the time back to the full amount.
  timeLeft = secondsPerQuestion;
  timerDisplay.textContent = "Time: " + timeLeft;

  // setInterval runs the code inside it once every 1000ms (1 second).
  timerId = setInterval(function () {
    timeLeft = timeLeft - 1;
    timerDisplay.textContent = "Time: " + timeLeft;

    // When the time runs out, stop the timer and move on.
    if (timeLeft <= 0) {
      stopTimer();

      // Record that this question was not answered (we use -1 for "no answer").
      userAnswers[currentQuestionIndex] = -1;

      goToNextQuestion();
    }
  }, 1000);
}


// ---- 9. STOP THE TIMER ----
// clearInterval turns off the repeating timer so it does not keep counting.
function stopTimer() {
  clearInterval(timerId);
}


// ---- 10. CHECK THE ANSWER THE USER CLICKED ----
// This runs when an option button is clicked. It highlights the
// correct and wrong answers, updates the score, then advances.
function checkAnswer(event) {
  // Error handling: if the answer is already locked, ignore extra clicks.
  if (answerIsLocked === true) {
    return;
  }

  // Lock the answer so the user cannot click another option.
  answerIsLocked = true;

  // Stop the countdown because the user has answered.
  stopTimer();

  // "event.target" is the exact button that was clicked.
  var clickedButton = event.target;

  // Read the option index we stored on the button earlier.
  // It comes back as text, so Number() turns it into a real number.
  var chosenIndex = Number(clickedButton.getAttribute("data-index"));

  // Find the correct index for the current question.
  var correctIndex = questions[currentQuestionIndex].correctAnswer;

  // Save the user's choice so we can show it on the Review screen.
  userAnswers[currentQuestionIndex] = chosenIndex;

  // If the choice matches the correct answer, add one to the score.
  if (chosenIndex === correctIndex) {
    score = score + 1;
  }

  // Go through every option button and color it green or red.
  var allOptionButtons = optionsContainer.children;
  for (var i = 0; i < allOptionButtons.length; i++) {
    var thisButton = allOptionButtons[i];
    var thisIndex = Number(thisButton.getAttribute("data-index"));

    // The correct option always turns green.
    if (thisIndex === correctIndex) {
      thisButton.classList.add("correct");
    }

    // If the user picked a wrong option, that one turns red.
    if (thisIndex === chosenIndex && chosenIndex !== correctIndex) {
      thisButton.classList.add("wrong");
    }
  }

  // Wait 1 second so the user can see the colors, then move on.
  setTimeout(goToNextQuestion, 1000);
}


// ---- 11. MOVE TO THE NEXT QUESTION (OR FINISH) ----
// This adds one to our position. If there are more questions we
// show the next one, otherwise we show the results.
function goToNextQuestion() {
  currentQuestionIndex = currentQuestionIndex + 1;

  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showResultsScreen();
  }
}


// ---- 12. SHOW THE RESULTS SCREEN ----
// This calculates the percentage and shows a pass or fail message.
function showResultsScreen() {
  showScreen(resultsScreen);

  // Work out the percentage. Math.round removes the decimals.
  var percentage = Math.round((score / questions.length) * 100);

  // Fill in the score and percentage text.
  scoreText.textContent =
    "You scored " + score + " out of " + questions.length;
  percentageText.textContent = "Percentage: " + percentage + "%";

  // A score of 50% or more counts as a pass.
  if (percentage >= 50) {
    passFailText.textContent = "Congratulations, you passed!";
  } else {
    passFailText.textContent = "Sorry, you did not pass. Try again!";
  }
}


// ---- 13. SHOW THE REVIEW SCREEN (my individual enhancement) ----
// This lists every question with the answer the user picked and
// the correct answer, so they can see what they got wrong.
function showReviewScreen() {
  showScreen(reviewScreen);

  // Clear out anything from a previous review.
  reviewContainer.innerHTML = "";

  // Loop through every question to build a review block for it.
  for (var i = 0; i < questions.length; i++) {
    var currentQuestion = questions[i];

    // The index the user picked for this question.
    var userChoiceIndex = userAnswers[i];

    // Work out the text the user picked. If it is -1 the timer ran out.
    var userChoiceText = "No answer (time ran out)";
    if (userChoiceIndex !== -1 && userChoiceIndex !== undefined) {
      userChoiceText = currentQuestion.options[userChoiceIndex];
    }

    // The text of the correct answer.
    var correctText = currentQuestion.options[currentQuestion.correctAnswer];

    // Create a box to hold this question's review.
    var reviewItem = document.createElement("div");
    reviewItem.classList.add("review-item");

    // Decide if the user's answer was right, to pick a color class.
    var answerClass = "your-answer-wrong";
    if (userChoiceIndex === currentQuestion.correctAnswer) {
      answerClass = "your-answer-correct";
    }

    // Build the inner HTML for this review block.
    reviewItem.innerHTML =
      '<p class="review-question">' + (i + 1) + ". " + currentQuestion.question + "</p>" +
      '<p class="' + answerClass + '">Your answer: ' + userChoiceText + "</p>" +
      "<p>Correct answer: " + correctText + "</p>";

    // Add the finished block into the review container.
    reviewContainer.appendChild(reviewItem);
  }
}
