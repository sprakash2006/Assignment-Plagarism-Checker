# 🧾 Assignment Plagiarism Checker

**Assignment Plagiarism Checker** is a **TypeScript tool** that detects plagiarism across multiple PDF assignments.  
It compares text using algorithms like **KMP**, **Rabin-Karp**, and **Edit Distance**, and groups similar files using **graph algorithms** for accurate and efficient plagiarism detection.

---

## 🚀 Features
- Upload and analyze multiple PDF assignments at once  
- Extract and preprocess text automatically  
- Detect both exact and partial (paraphrased) matches  
- Cluster similar files using graph-based similarity mapping  
- Display similarity percentages and results in a clear format  

---

## 🧠 Algorithms & DSA Concepts
- **KMP & Rabin-Karp** – Efficient substring matching  
- **Suffix Tree / Array** – Common substring detection  
- **Edit Distance (Dynamic Programming)** – Detect paraphrasing  
- **Hashing & Shingling** – Text chunk comparison  
- **Graph Algorithms (DFS/BFS)** – Cluster similar files  

---

## 🏗️ Tech Stack
- **Language:** TypeScript  
- **Libraries:** pdf-parse / pdf.js (for text extraction)  
- **Concepts:** HashMap, Suffix Array, Dynamic Programming, Graph Traversal  

---

## ⚙️ Installation

```bash
# Clone this repository
git clone https://github.com/your-username/assignment-plagiarism-checker.git

# Navigate to the project folder
cd assignment-plagiarism-checker

# Install dependencies
npm install

# Run the project
npm run dev
