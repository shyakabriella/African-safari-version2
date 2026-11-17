export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  imageCreditId: string;
  author: string;
  sections: {
    heading: string;
    paragraphs: string[];
  }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-plan-your-first-african-safari",
    title: "How to Plan Your First African Safari",
    category: "Safari Guide",
    excerpt:
      "Everything you need to know when planning your first unforgettable African wildlife adventure.",
    image: "/images/destinations/tanzania.jpg",
    imageAlt: "African wilderness in Tanzania",
    imageCreditId: "tanzania",
    author: "AFHBH Editorial Team",
    sections: [
      {
        heading: "Choose your safari destination",
        paragraphs: [
          "Africa offers an extraordinary variety of safari experiences. Tanzania and Kenya are known for their expansive savannahs, while Rwanda and Uganda offer memorable forest and wildlife adventures.",
          "Start by deciding what you want to experience. Your interests, travel dates and budget will help you narrow down your destination.",
        ],
      },
      {
        heading: "Decide when to travel",
        paragraphs: [
          "Wildlife viewing conditions vary by destination and season. Dry seasons can make some animals easier to observe, while green seasons offer beautiful landscapes and different wildlife experiences.",
          "Ask your safari operator about the conditions expected during your travel dates before confirming your itinerary.",
        ],
      },
      {
        heading: "Plan your accommodation",
        paragraphs: [
          "Safari accommodation ranges from comfortable camps to luxury lodges. Consider the location, meals, activities and transfers included in your stay.",
          "Choosing accommodation close to your planned activities can reduce travel time and help you enjoy more of your surroundings.",
        ],
      },
      {
        heading: "Set a realistic travel budget",
        paragraphs: [
          "Your safari budget should include accommodation, transportation, park entrance fees, meals, activities and applicable travel requirements.",
          "Request a detailed quotation from your operator so you understand what is included and what you need to pay separately.",
        ],
      },
      {
        heading: "Travel responsibly",
        paragraphs: [
          "Respect wildlife, follow your guide's instructions and avoid disturbing animals in their natural habitats.",
          "Supporting responsible tourism businesses can help protect natural environments and contribute to local communities.",
        ],
      },
    ],
  },
  {
    slug: "discover-the-beauty-of-rwanda",
    title: "Discover the Beauty of Rwanda",
    category: "Destinations",
    excerpt:
      "Explore the land of a thousand hills, its remarkable wildlife, peaceful lakes and rich cultural experiences.",
    image: "/images/destinations/rwanda.jpg",
    imageAlt: "Beautiful natural landscapes in Rwanda",
    imageCreditId: "rwanda",
    author: "AFHBH Editorial Team",
    sections: [
      {
        heading: "Welcome to the land of a thousand hills",
        paragraphs: [
          "Rwanda offers an inspiring combination of green hills, forests, lakes and wildlife destinations. Visitors can enjoy nature, cultural experiences and remarkable hospitality.",
          "Kigali is a natural starting point for many journeys through the country.",
        ],
      },
      {
        heading: "Explore Volcanoes National Park",
        paragraphs: [
          "Volcanoes National Park is internationally known for mountain gorilla trekking and its dramatic volcanic landscapes.",
          "Gorilla trekking requires advance arrangements and permits. Travelers should confirm current requirements with the relevant authorities or their safari operator.",
        ],
      },
      {
        heading: "Experience Akagera National Park",
        paragraphs: [
          "Akagera offers savannah wildlife experiences, lakes and diverse natural habitats.",
          "Game drives provide opportunities to observe wildlife while learning about the park and its conservation efforts.",
        ],
      },
      {
        heading: "Discover Nyungwe and Lake Kivu",
        paragraphs: [
          "Nyungwe National Park offers forest adventures and opportunities to explore Rwanda's remarkable biodiversity.",
          "Lake Kivu provides a different experience, with peaceful scenery and opportunities to relax after wildlife adventures.",
        ],
      },
    ],
  },
  {
    slug: "choosing-the-perfect-african-safari-lodge",
    title: "Choosing the Perfect African Safari Lodge",
    category: "Hotels & Lodges",
    excerpt:
      "Discover how to choose comfortable and memorable accommodation for your African safari adventure.",
    image: "/images/destinations/botswana.jpg",
    imageAlt: "Natural wilderness surrounding African safari destinations",
    imageCreditId: "botswana",
    author: "AFHBH Editorial Team",
    sections: [
      {
        heading: "Start with the location",
        paragraphs: [
          "Location is one of the most important considerations when choosing a safari lodge. Accommodation near your preferred wildlife activities may help reduce travel time.",
          "Check the distance from airports, park entrances and other destinations included in your itinerary.",
        ],
      },
      {
        heading: "Choose your accommodation style",
        paragraphs: [
          "African safari accommodation includes tented camps, traditional lodges, boutique hotels and luxury resorts.",
          "Think about the atmosphere you prefer, the facilities you need and the level of comfort that fits your travel plans.",
        ],
      },
      {
        heading: "Understand what is included",
        paragraphs: [
          "Some safari lodges include meals, game drives or transfers, while others charge separately for these services.",
          "Review the booking conditions carefully and request clarification about additional expenses before confirming your reservation.",
        ],
      },
      {
        heading: "Consider responsible accommodation",
        paragraphs: [
          "Look for accommodation providers that demonstrate responsible environmental practices and meaningful involvement with local communities.",
          "A thoughtful accommodation choice can help you enjoy your journey while supporting the destinations you visit.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
