// ==========================================================================
// NAQEEB NEWS — FIREBASE INITIALIZATION & HELPER MODULE
// Uses standard Firebase Modular SDK (ES6+)
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

let app = null;
let db = null;
let auth = null;
let storage = null;

// Initial Starter News Data with rich photography across all 6 categories
export const STARTER_NEWS = [
  // --- PAKISTAN ---
  {
    id: "starter-pak-1",
    title: "Pakistan Launches Historic 5,000 MW Green Solar & Hydroelectric Energy Corridor",
    description: "Islamabad — In a historic milestone for national energy independence, the federal government today unveiled a comprehensive multi-billion rupee solar and clean energy corridor project. The initiative will add 5,000 MW of clean renewable energy to the national grid over the next three years. Key components include subsidized residential rooftop solar programs, green solarization of agricultural tube-wells across Punjab and Sindh, and modern smart-grid transmission corridors.",
    category: "Pakistan",
    author: "Zainab Tariq",
    imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: "starter-pak-2",
    title: "Northern Valleys Eco-Tourism Initiative Drives Record International Visitor Influx",
    description: "Gilgit-Baltistan — The northern mountain corridors of Hunza, Skardu, and Swat have reported a record surge in eco-tourism following the completion of upgraded all-weather highway connections and solar-powered hospitality lodges. Environmental authorities have deployed strict waste management and conservation protocols to safeguard glacial heritage.",
    category: "Pakistan",
    author: "Tariq Mehmood",
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "starter-pak-3",
    title: "Karachi Deep-Sea Maritime Terminal Inaugurates Next-Gen Automated Cargo System",
    description: "Karachi — The Port of Karachi has completed a state-of-the-art digital modernization project, integrating AI-assisted container tracking and high-speed gantry cranes. The upgrade reduces cargo turnaround times by 40%, cementing the port as a premier logistics hub for regional maritime trade.",
    category: "Pakistan",
    author: "Kamran Qureshi",
    imageUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "starter-pak-4",
    title: "National Tech & IT Export Corridor Reaches Record $3.5 Billion Annual Milestone",
    description: "Lahore — Pakistan's software export industry has achieved a landmark milestone, crossing $3.5 billion in annual revenue. High-growth sectors including artificial intelligence services, cloud infrastructure, and fintech software development led the surge, supported by nationwide special tech zones.",
    category: "Pakistan",
    author: "Fatima Noor",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 7).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString()
  },

  // --- WORLD ---
  {
    id: "starter-world-1",
    title: "Global Climate Summit Concludes with Historic Multi-Nation $100 Billion Resilience Accord",
    description: "Geneva — Representatives from over 140 countries have reached a comprehensive climate consensus in Geneva today, establishing a dedicated $100 billion international resilience fund. The agreement prioritizes vulnerable developing economies for climate mitigation projects and green energy technology transfers.",
    category: "World",
    author: "Haroon Rashid",
    imageUrl: "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: "starter-world-2",
    title: "International Space Consortium Announces Next-Gen Deep Orbital Lunar Observatory",
    description: "Cape Canaveral — A joint mission between international aerospace agencies has cleared its final engineering review for a deep-space lunar orbital telescope. The observatory will peer further into cosmic history than any previous instrument, studying early stellar formations.",
    category: "World",
    author: "Dr. Elena Rostova",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 8).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: "starter-world-3",
    title: "Transcontinental High-Speed Electric Rail Network Expands Across 12 Capital Cities",
    description: "Brussels — European transport ministers celebrated the inauguration of the expanded cross-border high-speed rail network today. Powered completely by wind and solar grids, the 320 km/h trains provide a zero-emission alternative to regional short-haul commercial flights.",
    category: "World",
    author: "Lucas Meyer",
    imageUrl: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 11).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 11).toISOString()
  },
  {
    id: "starter-world-4",
    title: "United Nations Global Food Relief Program Deploys Drought-Resilient Crop Seeds",
    description: "Nairobi — The UN Agricultural Commission has rolled out a major drought-resilience seed distribution campaign across 18 partner nations, helping local farming communities secure sustainable grain harvests despite fluctuating seasonal rainfall patterns.",
    category: "World",
    author: "Amara Keita",
    imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 14).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString()
  },

  // --- SPORTS ---
  {
    id: "starter-sports-1",
    title: "Pakistan Cricket Team Clinches Tri-Series Trophy with Electrifying Last-Over Finish",
    description: "Lahore — In a heart-stopping finale under the floodlights of Gaddafi Stadium, Pakistan captured the tri-series championship trophy with a breathtaking boundary off the final delivery. The bowling attack showcased world-class reverse swing before the middle order pulled off an audacious chase.",
    category: "Sports",
    author: "Bilal Ahmad",
    imageUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: "starter-sports-2",
    title: "Champions League Quarterfinals Deliver Thrilling Comeback Stunners in Extra Time",
    description: "Madrid — Football fans witnessed one of the most exhilarating European knockout nights in recent memory as dramatic stoppage-time headers flipped two high-stakes quarterfinal ties before 80,000 roaring spectators.",
    category: "Sports",
    author: "Marco Silva",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 9).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 9).toISOString()
  },
  {
    id: "starter-sports-3",
    title: "Grand Slam Tennis Final Sets Five-Set Masterclass of Endurance and Power Serves",
    description: "Melbourne — A grueling five-hour championship match ended with a first-time major champion raising the silver cup after firing 28 aces and saving three match points in a dramatic fifth-set tiebreaker.",
    category: "Sports",
    author: "Chloe Vance",
    imageUrl: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 15).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString()
  },
  {
    id: "starter-sports-4",
    title: "National Athletics Championship Breaks Two Decades-Old Sprinting & Javelin Records",
    description: "Islamabad — The National Sports Complex witnessed explosive performances as young track athletes set new national records in the 100-meter sprint and javelin throw, earning qualification berths for the upcoming Asian Games.",
    category: "Sports",
    author: "Saad Rehman",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 18).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },

  // --- TECHNOLOGY ---
  {
    id: "starter-tech-1",
    title: "Breakthrough in 2nm Semiconductor Design Slashes Power Usage by 80% for Edge AI",
    description: "San Jose — Chip architects and nanotechnology researchers announced a revolutionary semiconductor architecture that reduces thermal dissipation and energy consumption by 80% while tripling neural network processing speeds on mobile and IoT devices.",
    category: "Technology",
    author: "Ayesha Malik",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 6).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: "starter-tech-2",
    title: "Next-Generation Autonomous Robotics Deployed in High-Precision Automated Warehouses",
    description: "Tokyo — Industrial automation leaders demonstrated self-orchestrating warehouse robots capable of sorting over 10,000 packages per hour with sub-millimeter positioning accuracy, powered by real-time computer vision.",
    category: "Technology",
    author: "Kenji Sato",
    imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 10).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString()
  },
  {
    id: "starter-tech-3",
    title: "Quantum Computing Network Demonstrates Ultra-Secure Quantum Key Cryptography",
    description: "Zurich — Physicists have successfully transferred encrypted quantum data over 200 kilometers of standard fiber optic cable without repeaters, proving the viability of unhackable communication channels for commercial banks and data centers.",
    category: "Technology",
    author: "Dr. Armin Weber",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 16).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 16).toISOString()
  },
  {
    id: "starter-tech-4",
    title: "Solid-State Super-Battery Breakthrough Delivers 1,000 KM Range on 10-Minute Charge",
    description: "Seoul — Automotive engineering labs have unveiled commercial prototypes of a solid-state electrolyte battery. The innovation eliminates fire risks, operates at freezing temperatures, and provides unprecedented energy density for electric vehicles.",
    category: "Technology",
    author: "Min-Jun Park",
    imageUrl: "https://images.unsplash.com/photo-1558441719-ef048974a930?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 20).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
  },

  // --- BUSINESS ---
  {
    id: "starter-biz-1",
    title: "Stock Exchange Surpasses All-Time Record Milestone as Tech & Export Sectors Rally",
    description: "Karachi — The benchmark equity index surged past key resistance levels today, adding over 1,400 points in heavy trading volume. The rally was fueled by robust foreign direct investments, improved macroeconomic stability, and strong balance sheets across financial and manufacturing blue chips.",
    category: "Business",
    author: "Farhan Saeed",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 1).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: "starter-biz-2",
    title: "Central Bank Rolls Out Seamless Instant QR Micro-Payment Grid for Small Merchants",
    description: "Islamabad — In a major push toward digital financial inclusion, millions of small vendors and retail merchants can now accept instant mobile payments with zero transaction fees, accelerating cash-to-digital economic transition.",
    category: "Business",
    author: "Noman Aslam",
    imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 13).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 13).toISOString()
  },
  {
    id: "starter-biz-3",
    title: "Global Aviation Carriers Order 300 Next-Generation Fuel-Efficient Passenger Jets",
    description: "Dubai — Major international airlines placed historic aircraft orders at the International Aerospace Expo, committing $45 billion toward ultra-efficient twin-engine airliners designed to reduce carbon footprint by 25% on intercontinental routes.",
    category: "Business",
    author: "Rashid Al-Maktoum",
    imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 17).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 17).toISOString()
  },
  {
    id: "starter-biz-4",
    title: "Venture Capital Inflows in Clean-Tech and Agri-Tech Accelerators Reach Record High",
    description: "Singapore — Regional venture capital funds deployed $8.2 billion into sustainable startups this quarter, focusing on precision farming, AI water management, and decentralized green cold-chain storage solutions.",
    category: "Business",
    author: "Sheryl Tan",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 22).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 22).toISOString()
  },

  // --- ENTERTAINMENT ---
  {
    id: "starter-ent-1",
    title: "International Film Gala Celebrates South Asian Cinema Pioneers and Independent Directors",
    description: "London — The 28th International Film Gala concluded last night with top accolades presented to indie narrative films and documentaries celebrating cultural heritage, music, and contemporary social dialogues before an audience of celebrated global artists.",
    category: "Entertainment",
    author: "Sana Mir",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "starter-ent-2",
    title: "World Symphony Orchestra Premieres Classical Fusion Odyssey at Historic Amphitheater",
    description: "Vienna — Over 120 master musicians from 30 countries united to perform an unforgettable orchestral synthesis blending Eastern classical sitar and rabab melodies with sweeping Western symphonic arrangements.",
    category: "Entertainment",
    author: "Stefan Holzer",
    imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: "starter-ent-3",
    title: "Anticipated Sci-Fi Cinematic Saga Breaks Global Advance Ticket Booking Records",
    description: "Los Angeles — Studio executives confirmed unprecedented advance box office sales for the upcoming visual masterpiece, with IMAX theaters in over 65 countries selling out opening weekend screenings weeks in advance.",
    category: "Entertainment",
    author: "Jessica Reed",
    imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 19).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 19).toISOString()
  },
  {
    id: "starter-ent-4",
    title: "National Heritage & Contemporary Arts Festival Opens with Over 200 Curated Exhibits",
    description: "Lahore — The historic Alhamra Arts Centre opened its doors to art enthusiasts, showcasing traditional calligraphy, modern sculpture, folk music performances, and interactive digital canvas installations.",
    category: "Entertainment",
    author: "Aliya Rizvi",
    imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
    imagePath: "",
    date: new Date(Date.now() - 3600000 * 23).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 23).toISOString()
  }
];

// Initialize Firebase if configured
if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    console.log("✅ Firebase initialized successfully with project:", firebaseConfig.projectId);
  } catch (err) {
    console.warn("⚠️ Firebase initialization warning:", err.message);
  }
} else {
  console.info("ℹ️ Firebase configuration placeholder active. Replace keys in js/firebase-config.js for live backend.");
}

/**
 * Standard Firestore error logger & dispatcher
 */
export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null
    }
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  return errInfo;
}

export {
  app,
  db,
  auth,
  storage,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};
