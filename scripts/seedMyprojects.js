// This script seeds My Causes with 3 sample causes
// Run this from the app context when needed (e.g., in a debug screen or manually)

const myProjectsSeed = [
  {
    id: "my-1",
    name: "Community Food Drive",
    favorite: false,
    tags: ["community", "food"],
    ingredients: [
      { name: "canned goods", amount: "50", unit: "items", type: "dry", category: "Donations" },
      { name: "fresh produce", amount: "20", unit: "lbs", type: "dry", category: "Donations" }
    ],
    method: "Collect donations, sort items, coordinate drop-off with local shelters.",
    published: false
  },
  {
    id: "my-2",
    name: "Neighborhood Coat Drive",
    favorite: false,
    tags: ["community", "winter"],
    ingredients: [
      { name: "adult coats", amount: "30", unit: "items", type: "dry", category: "Donations" },
      { name: "child coats", amount: "20", unit: "items", type: "dry", category: "Donations" }
    ],
    method: "Collect gently used coats, clean as needed, distribute through partner organizations.",
    published: false
  },
  {
    id: "my-3",
    name: "Literacy Tutoring Program",
    favorite: false,
    tags: ["education", "volunteer"],
    ingredients: [
      { name: "volunteer tutors", amount: "10", unit: "people", type: "dry", category: "Volunteers" },
      { name: "books", amount: "200", unit: "items", type: "dry", category: "Donations" }
    ],
    method: "Recruit volunteers, match tutors with students, run weekly tutoring sessions.",
    published: false
  }
];

export default myProjectsSeed;
