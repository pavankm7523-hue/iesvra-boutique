import { Review } from "./products";

// Authentic Indian Customer Names
const FIRST_NAMES = [
  "Aarav", "Priya", "Rajesh", "Ananya", "Vikram", "Sneha", "Gurpreet", "Amit",
  "Meenakshi", "Harish", "Tanvi", "Rahul", "Shreya", "Deepa", "Sanjay", "Pooja",
  "Karthik", "Farhan", "Swati", "Manoj", "Divya", "Ritu", "Chetan", "Shalini",
  "Alok", "Sunita", "Pradeep", "Vandana", "Nitin", "Simran", "Varun", "Lavanya",
  "Arvind", "Bhavna", "Saurabh", "Keerthi", "Abhishek", "Nandini", "Rohan", "Anjali",
  "Gaurav", "Kavita", "Siddharth", "Pallavi", "Aditya", "Roshni", "Manish", "Tanya",
  "Naveen", "Archana", "Kunal", "Preeti", "Suresh", "Ishita", "Tarun", "Rashmi",
  "Deepak", "Monika", "Vikas", "Jaspreet", "Brijesh", "Neerja", "Lokesh", "Komal"
];

const LAST_NAMES = [
  "Sharma", "Patel", "Verma", "Reddy", "Nair", "Kulkarni", "Sengupta", "Deshmukh",
  "Singh", "Banerjee", "Sundaram", "Varma", "Shah", "Kaushik", "Joshi", "Pillai",
  "Chawla", "Agarwal", "Raman", "Ansari", "Bhattacharya", "Tiwari", "Nambiar", "Goyal",
  "Hegde", "Mukherjee", "Yadav", "Chauhan", "Mehta", "Kaur", "Sethi", "Krishnan",
  "Rathore", "Mishra", "Gupta", "Malhotra", "Kapoor", "Bhatia", "Bansal", "Dutta",
  "Choudhury", "Bose", "Saxena", "Iyer", "Menon", "Acharya", "Pandey", "Chatterjee"
];

export const CITIES = [
  "Bengaluru, KA", "Mumbai, MH", "Delhi NCR", "Hyderabad, TS", "Chennai, TN",
  "Pune, MH", "Kolkata, WB", "Ahmedabad, GJ", "Jaipur, RJ", "Chandigarh, PB",
  "Lucknow, UP", "Indore, MP", "Kochi, KL", "Coimbatore, TN", "Nagpur, MH",
  "Bhopal, MP", "Visakhapatnam, AP", "Surat, GJ", "Patna, BR", "Vadodara, GJ",
  "Dehradun, UK", "Guwahati, AS", "Mysuru, KA", "Bhubaneswar, OD", "Ranchi, JH"
];

// Deterministic Pseudo-Random Number Generator based on seed (Product ID + index)
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function getRandomDate(seed: number, daysRange = 240): string {
  const baseDate = new Date(2026, 7, 25); // Late August 2026
  const daysOffset = Math.floor(seededRandom(seed) * daysRange) + 1;
  const date = new Date(baseDate.getTime() - daysOffset * 24 * 60 * 60 * 1000);
  return date.toISOString().split("T")[0];
}

// Generate 30 to 35 realistic AI reviews tailored to the product
export function generateProductReviews(productId: string, productName: string, category: string = "General"): Review[] {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash << 5) - hash + productId.charCodeAt(i);
    hash |= 0;
  }
  const baseSeed = Math.abs(hash);

  // Pick total review count between 31 and 35 per product
  const count = 30 + (baseSeed % 6);
  const reviews: Review[] = [];
  const usedNames = new Set<string>();

  const pName = (productName || "Product").toLowerCase();
  const cat = (category || "").toLowerCase();

  for (let i = 0; i < count; i++) {
    const seed = baseSeed + i * 17 + 101;
    
    // Pick unique author name
    let firstNameIndex = Math.floor(seededRandom(seed + 1) * FIRST_NAMES.length);
    let lastNameIndex = Math.floor(seededRandom(seed + 2) * LAST_NAMES.length);
    let author = `${FIRST_NAMES[firstNameIndex]} ${LAST_NAMES[lastNameIndex]}`;
    let attempts = 0;
    while (usedNames.has(author) && attempts < 10) {
      firstNameIndex = (firstNameIndex + 3) % FIRST_NAMES.length;
      lastNameIndex = (lastNameIndex + 5) % LAST_NAMES.length;
      author = `${FIRST_NAMES[firstNameIndex]} ${LAST_NAMES[lastNameIndex]}`;
      attempts++;
    }
    usedNames.add(author);

    const city = CITIES[Math.floor(seededRandom(seed + 3) * CITIES.length)];
    const date = getRandomDate(seed + 4);

    // Realistic Rating Distribution: 70% 5-Star, 22% 4-Star, 6% 3-Star, 2% 2-Star (Average ~4.6-4.8)
    const ratingRoll = seededRandom(seed + 5);
    let rating = 5;
    if (ratingRoll < 0.68) {
      rating = 5;
    } else if (ratingRoll < 0.90) {
      rating = 4;
    } else if (ratingRoll < 0.97) {
      rating = 3;
    } else {
      rating = 2;
    }

    let comment = "";

    // Product Category / Keyword Contextual Comments
    if (cat.includes("home") || cat.includes("kitchen") || pName.includes("masala") || pName.includes("jar") || pName.includes("container") || pName.includes("dish") || pName.includes("cleaner") || pName.includes("cutter") || pName.includes("rack")) {
      const fiveStarComments = [
        `Exceptional build quality! Fits seamlessly in our kitchen storage. The plastic is thick, durable, and completely odorless.`,
        `Very useful kitchen organizer. Keeps all spices clean and moisture-free. My mother was extremely happy with this purchase.`,
        `High-grade material with an airtight lid that actually works. Looks premium on the shelf. Delivered swiftly to ${city}.`,
        `Value for money! Sturdy construction and thoughtful design. Definitely ordering another set for the pantry.`,
        `Super handy and functional. Solved our cabinet clutter issue immediately. 10/10 recommended for modern homes!`,
        `Solid finish and durable compartments. Surpassed expectations for this price range. Very satisfied with IESVRA service.`,
        `The spoon design and easy-open latch make daily cooking so much faster. Clean and aesthetic finish.`,
        `Arrived safely packed in multiple protective layers. No scratches or damage. Highly recommended kitchen utility!`,
        `Used it daily for over a month now, still as good as new. Dishwasher safe and very easy to maintain.`,
        `Excellent storage capacity without taking excessive counter space. Great Indian household essential.`
      ];
      const fourStarComments = [
        `Good product overall. Quality is solid and serves its purpose well. Delivery took 3 days, but product is great.`,
        `Very practical for daily cooking. Plastic grade is good. Slightly smaller than expected from photos, but highly functional.`,
        `Nice finish and easy to clean. Does the job efficiently without cluttering the kitchen.`,
        `Sturdy lids and nice transparent view. Good value for money.`
      ];
      const lowerStarComments = [
        `Decent product for regular use. Could have been slightly deeper in volume, but works fine for daily condiments.`,
        `Average build quality, but for the discounted price it is acceptable and useful.`
      ];

      if (rating === 5) comment = fiveStarComments[Math.floor(seededRandom(seed + 6) * fiveStarComments.length)];
      else if (rating === 4) comment = fourStarComments[Math.floor(seededRandom(seed + 6) * fourStarComments.length)];
      else comment = lowerStarComments[Math.floor(seededRandom(seed + 6) * lowerStarComments.length)];
    } else if (cat.includes("drinkware") || pName.includes("bottle") || pName.includes("flask") || pName.includes("mug") || pName.includes("steel") || pName.includes("tumbler")) {
      const fiveStarComments = [
        `100% leakproof! Keeps water ice cold for over 18 hours even during humid afternoons. Finish is scratch-resistant.`,
        `Bought this for my gym and office routine. Looks super stylish and the grip is very comfortable. Zero plastic smell!`,
        `Amazing quality stainless steel / BPA-free body. The gradient aesthetic is gorgeous and the straw mechanism works smoothly.`,
        `Best bottle set I have purchased online. The motivational markers really help track daily water intake. Top notch!`,
        `Durable, lightweight, and very easy to clean. Arrived safely packaged with zero dents in ${city}.`,
        `The silicone seal is completely leakproof even when kept sideways in my laptop backpack. Very trustworthy.`,
        `Great temperature retention! Tested with boiling hot tea for 12 hours and it stayed piping hot.`,
        `Solid tactile feel in hand. The matte coating does not chip or peel. Excellent craftsmanship.`
      ];
      const fourStarComments = [
        `Good quality bottle. Insulation works nicely for around 12-14 hours. Straw takes a little effort to wash but overall great.`,
        `Sturdy build and aesthetic colors. Fits in standard car cup holders. Happy with the purchase.`,
        `Solid bottle for college and gym. Does not leak even when upside down in my backpack.`
      ];
      const lowerStarComments = [
        `Keeps water cool for 8-10 hours. Cap hinge feels slightly delicate, but usable with care.`,
        `Decent bottle. The color is slightly darker than the product photos, but functional.`
      ];

      if (rating === 5) comment = fiveStarComments[Math.floor(seededRandom(seed + 6) * fiveStarComments.length)];
      else if (rating === 4) comment = fourStarComments[Math.floor(seededRandom(seed + 6) * fourStarComments.length)];
      else comment = lowerStarComments[Math.floor(seededRandom(seed + 6) * lowerStarComments.length)];
    } else if (cat.includes("mobile") || pName.includes("airpod") || pName.includes("headphone") || pName.includes("watch") || pName.includes("earphone") || pName.includes("audio") || pName.includes("speaker") || pName.includes("cable") || pName.includes("stand")) {
      const fiveStarComments = [
        `Sound quality and battery backup are stellar! Crisp bass, clear vocals, and instant Bluetooth pairing with my phone.`,
        `Surpassed my expectations. The build is premium, latency is negligible for videos and casual gaming, and fit is snug.`,
        `Excellent gadget! Battery easily lasts 2-3 days with moderate usage. Noise isolation does a remarkable job.`,
        `Sleek design and fast charging support. Very good microphone clarity even in outdoor street traffic.`,
        `Pairs effortlessly and connection remains stable throughout my apartment. Delivered in 2 days to ${city}.`,
        `Ear cushions are plush and breathable for long meetings. No ear fatigue even after 4 hours of continuous use.`,
        `Compact charging case with strong magnetic snap. Genuine tech accessory at an unbeatable price!`,
        `Crisp instrument separation and punchy low end. Highly recommended for music lovers on a budget.`
      ];
      const fourStarComments = [
        `Very solid gadget. Sound signature is balanced. Ear cushions are soft. Battery is around 85% of advertised time which is still great.`,
        `Good value for money. Microphone is clear indoors. Build quality feels sturdy and compact.`,
        `Nice audio clarity and good build. Type-C fast charging is very convenient.`
      ];
      const lowerStarComments = [
        `Average bass response, but fine for podcasts and routine office calls. Build is decent for the price.`,
        `Works well, though took a few tries to understand the touch controls at first.`
      ];

      if (rating === 5) comment = fiveStarComments[Math.floor(seededRandom(seed + 6) * fiveStarComments.length)];
      else if (rating === 4) comment = fourStarComments[Math.floor(seededRandom(seed + 6) * fourStarComments.length)];
      else comment = lowerStarComments[Math.floor(seededRandom(seed + 6) * lowerStarComments.length)];
    } else if (cat.includes("beauty") || cat.includes("personal") || pName.includes("hair") || pName.includes("facial") || pName.includes("trimmer") || pName.includes("skincare") || pName.includes("vanity") || pName.includes("makeup") || pName.includes("roller")) {
      const fiveStarComments = [
        `Gives salon-like smooth results at home! Super gentle on skin with zero tugging or irritation. Battery life is fantastic.`,
        `Must-have in everyday self-care kit. Compact, portable, and remarkably effective. My skin feels fresh and smooth.`,
        `High quality motor and ergonomic grip. Easy to clean under running water. Delivered in pristine packaging!`,
        `Worth every single rupee. Compact enough to carry in my travel pouch and charges via USB quickly.`,
        `Aesthetic design and premium feel. It performs effortlessly. Highly recommended for daily grooming in ${city}.`,
        `Very gentle on sensitive skin. The precision head reaches contours effortlessly. Loved the rose gold details.`,
        `My wife loved this gift! High quality build, minimal noise, and very neat finish.`
      ];
      const fourStarComments = [
        `Good personal care tool. Gentle on sensitive skin. Takes a bit of practice to get the best angle, but results are neat.`,
        `Quality is reliable. Blades are sharp and safe. Battery lasts around 45 minutes of continuous use.`,
        `Very practical and compact. Nice addition to my grooming routine.`
      ];
      const lowerStarComments = [
        `Works decently. Needs cleaning after every use to maintain speed, but good for quick touch-ups.`,
        `Fair quality product. Motor sound is slightly audible, but gets the job done safely.`
      ];

      if (rating === 5) comment = fiveStarComments[Math.floor(seededRandom(seed + 6) * fiveStarComments.length)];
      else if (rating === 4) comment = fourStarComments[Math.floor(seededRandom(seed + 6) * fourStarComments.length)];
      else comment = lowerStarComments[Math.floor(seededRandom(seed + 6) * lowerStarComments.length)];
    } else if (cat.includes("massager") || pName.includes("massager") || pName.includes("gun") || pName.includes("neck") || pName.includes("back") || pName.includes("pillow")) {
      const fiveStarComments = [
        `Instant relief from neck and back stiffness after long desk hours! Multiple speed modes and deep tissue percussion work wonders.`,
        `Remarkable power and very quiet motor. Battery easily lasts 4-5 sessions on a single charge. My parents love it!`,
        `Heavy-duty build quality, ergonomic silicone grip, and comes with versatile attachment heads. Worth every penny.`,
        `Life saver for post-workout muscle soreness. Feels just like professional therapy at home.`,
        `Compact yet powerful. Delivered fast to ${city} with warranty card and USB-C charging cord.`,
        `The heat therapy feature combined with kneading rotation provides deep relaxation before sleeping.`
      ];
      const fourStarComments = [
        `Very effective massage pressure. Speed 3 is powerful enough for sore muscles. A bit heavy to hold for long, but works great.`,
        `Good therapeutic device. Relief is noticeable within 10 minutes of use. Battery charges in ~2 hours.`,
        `Solid quality. Helps relieve shoulder pain and stiff traps efficiently.`
      ];
      const lowerStarComments = [
        `Decent massager. Strong vibration on higher levels. Keep it on level 1 or 2 for best comfort.`,
        `Good product, instructions manual could have had more diagrams, but easy to operate.`
      ];

      if (rating === 5) comment = fiveStarComments[Math.floor(seededRandom(seed + 6) * fiveStarComments.length)];
      else if (rating === 4) comment = fourStarComments[Math.floor(seededRandom(seed + 6) * fourStarComments.length)];
      else comment = lowerStarComments[Math.floor(seededRandom(seed + 6) * lowerStarComments.length)];
    } else if (cat.includes("books") || pName.includes("ncert") || pName.includes("physics") || pName.includes("chemistry") || pName.includes("maths") || pName.includes("pcm") || pName.includes("pcb")) {
      const fiveStarComments = [
        `Brand new, latest 2026-2027 curriculum edition! Crisp printing, smooth page binding, and arrived without any folded corners.`,
        `Complete set as described. Excellent paper quality and includes all updated syllabus chapters. Delivered in 2 days to ${city}.`,
        `Essential for JEE/NEET and board exam prep. Authentic NCERT copies with original holograms and sharp diagrams.`,
        `Well-packaged in protective bubble wrap. Very satisfied with the prompt delivery and genuine books.`,
        `Best price compared to local stationery stores. All volumes included without any missing pages.`,
        `Original Govt publication with genuine binding. Clear font and error-free theory.`
      ];
      const fourStarComments = [
        `Authentic books with latest syllabus. Binding is sturdy. Printing is clear and readable.`,
        `Good set of textbooks. Delivery was prompt. Pages are clean and font is sharp.`,
        `Genuine NCERT print. Very helpful for standard XI/XII revision.`
      ];
      const lowerStarComments = [
        `Standard NCERT books. Paper quality is moderate as standard Govt prints, but content is complete and updated.`,
        `Books arrived in good condition, slight outer cover crease during transit, but inside pages are 100% fine.`
      ];

      if (rating === 5) comment = fiveStarComments[Math.floor(seededRandom(seed + 6) * fiveStarComments.length)];
      else if (rating === 4) comment = fourStarComments[Math.floor(seededRandom(seed + 6) * fourStarComments.length)];
      else comment = lowerStarComments[Math.floor(seededRandom(seed + 6) * lowerStarComments.length)];
    } else {
      // General lifestyle / Daily essentials
      const fiveStarComments = [
        `Top-notch product! Exceeded my expectations in build quality, usability, and durability. Very happy with IESVRA.`,
        `Sturdy material, elegant design, and works exactly as showcased in photos. Fast shipping to ${city}.`,
        `Value for money deal! Daily utility is high and the craftsmanship feels premium.`,
        `Arrived safely packed with verified quality check. Definitely ordering more items from this boutique!`,
        `Excellent finish and great functionality. Solved our daily requirement with ease.`,
        `Premium feel and sleek finish. Delivered on time with cash on delivery option.`
      ];
      const fourStarComments = [
        `Good quality product. Matches the description nicely. Useful and well built for daily tasks.`,
        `Satisfied with the purchase. Decent price for this quality in ${city}.`,
        `Practical and durable. Recommended for everyday usage.`
      ];
      const lowerStarComments = [
        `Decent product for this price. Serves its basic purpose fine.`,
        `Fair quality, works as expected.`
      ];

      if (rating === 5) comment = fiveStarComments[Math.floor(seededRandom(seed + 6) * fiveStarComments.length)];
      else if (rating === 4) comment = fourStarComments[Math.floor(seededRandom(seed + 6) * fourStarComments.length)];
      else comment = lowerStarComments[Math.floor(seededRandom(seed + 6) * lowerStarComments.length)];
    }

    reviews.push({
      id: `rev_${productId}_${i + 1}`,
      author,
      rating,
      comment,
      date,
    });
  }

  // Sort newest first
  reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return reviews;
}
