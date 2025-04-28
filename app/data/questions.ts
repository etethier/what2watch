import { Question } from '../types';

export const questions: Question[] = [
  {
    id: 1,
    text: "Set the vibe — how do you wanna feel while watching? 🎥",
    options: [
      { id: 1, text: "Make me laugh", value: "laugh" },
      { id: 2, text: "I want to cry", value: "cry" },
      { id: 3, text: "High-stakes drama", value: "drama" },
      { id: 4, text: "Something mind-blowing", value: "mind-blowing" },
      { id: 5, text: "Feel-good & uplifting", value: "uplifting" },
      { id: 6, text: "Wild plot twists", value: "plot-twists" },
      { id: 7, text: "Cozy & comforting", value: "cozy" },
      { id: 8, text: "Dark and intense", value: "dark" },
      { id: 9, text: "Educational or thought-provoking", value: "educational" },
      { id: 10, text: "Background noise / easy watch", value: "background" }
    ],
    multiSelect: true
  },
  {
    id: 2,
    text: "Pick your flavor — what genres are calling your name? 🍿",
    options: [
      { id: 1, text: "Comedy", value: "comedy" },
      { id: 2, text: "Action", value: "action" },
      { id: 3, text: "Thriller / Mystery", value: "thriller" },
      { id: 4, text: "Sci-Fi / Fantasy", value: "scifi-fantasy" },
      { id: 5, text: "Romance", value: "romance" },
      { id: 6, text: "Documentary", value: "documentary" },
      { id: 7, text: "True Crime", value: "true-crime" },
      { id: 8, text: "Animated", value: "animated" },
      { id: 9, text: "Supernatural", value: "supernatural" },
      { id: 10, text: "Historical", value: "historical" }
    ],
    multiSelect: true
  },
  {
    id: 3,
    text: "How big of a watch are you in the mood for? 📏",
    options: [
      { id: 1, text: "Just a quick movie", value: "movie" },
      { id: 2, text: "A mini-series snack (under 6 episodes)", value: "mini-series" },
      { id: 3, text: "A full season feast", value: "season" },
      { id: 4, text: "A multi-season deep dive", value: "multi-season" },
      { id: 5, text: "I'm flexible, bring it on", value: "flexible" }
    ],
    multiSelect: false
  },
  {
    id: 4,
    text: "Where are you ready to stream from? 📺",
    options: [
      { id: 1, text: "Netflix", value: "netflix" },
      { id: 2, text: "Amazon Prime", value: "prime" },
      { id: 3, text: "Hulu", value: "hulu" },
      { id: 4, text: "HBO Max / Crave", value: "hbo" },
      { id: 5, text: "Disney+", value: "disney" },
      { id: 6, text: "Apple TV+", value: "apple" },
      { id: 7, text: "Peacock", value: "peacock" },
      { id: 8, text: "Paramount+", value: "paramount" },
      { id: 9, text: "Tubi / Free services", value: "free" },
      { id: 10, text: "All The Above", value: "all" }
    ],
    multiSelect: true
  },
  {
    id: 5,
    text: "How fresh do you want it? 🕰️",
    options: [
      { id: 1, text: "Doesn't matter — just make it good", value: "any" },
      { id: 2, text: "Hot off the press (last 1–2 years)", value: "newest" },
      { id: 3, text: "Pretty recent (last 5 years)", value: "recent" },
      { id: 4, text: "I'm down for a modern classic (last 10 years)", value: "modern-classic" }
    ],
    multiSelect: false
  },
  {
    id: 6,
    text: "How spicy can we get with the rating? 🌶️",
    options: [
      { id: 1, text: "Anything goes!", value: "any-rating" },
      { id: 2, text: "Keep it G/PG — family vibes only", value: "family" },
      { id: 3, text: "PG-13 sounds perfect", value: "pg13" },
      { id: 4, text: "R/Mature — bring it on", value: "mature" }
    ],
    multiSelect: false
  },
  {
    id: 7,
    text: "Who's joining your movie mission tonight? 🎉",
    options: [
      { id: 1, text: "Just me, myself, and I", value: "solo" },
      { id: 2, text: "Movie date vibes", value: "date" },
      { id: 3, text: "Friends night", value: "friends" },
      { id: 4, text: "Family movie night", value: "family" }
    ],
    multiSelect: false
  }
]; 