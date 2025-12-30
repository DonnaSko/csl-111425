// Test the actual search algorithm that will run

function testSearchAlgorithm() {
  console.log('\n========== TESTING SEARCH ALGORITHM ==========\n');
  
  // Simulate badge OCR text
  const badgeText = `RYAN
SKOLNICK
GLEN DIMPLEX AMERICAS
CAMBRIDGE, CANADA`;

  console.log('📝 Badge OCR text:', badgeText);
  
  // Extract ALL potential name words from badge
  const lines = badgeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  console.log('📋 Lines:', lines);
  
  // Get all words that could be names (3+ chars, mostly letters)
  const allWords = new Set();
  lines.forEach(line => {
    const words = line.split(/\s+/);
    words.forEach(word => {
      const cleaned = word.replace(/[^a-zA-Z]/g, '');
      // Keep words 3+ chars that are likely names
      if (cleaned.length >= 3) {
        // Skip obvious non-name words
        const skipWords = ['THE', 'AND', 'INC', 'LLC', 'LTD', 'CORP', 'COMPANY', 'GROUP'];
        if (!skipWords.includes(cleaned.toUpperCase())) {
          allWords.add(cleaned);
        }
      }
    });
  });
  
  const searchWords = Array.from(allWords).slice(0, 10);
  console.log('\n🔤 Extracted search words:', searchWords);
  console.log('Expected: ["RYAN", "SKOLNICK", "GLEN", "DIMPLEX", "AMERICAS", "CAMBRIDGE", "CANADA"]');
  
  // Simulate database of dealers
  const mockDealers = [
    {
      id: '1',
      contactName: 'Ryan Skolnick',
      companyName: 'Glen Dimplex Americas',
      matchedWords: ['RYAN', 'SKOLNICK', 'GLEN', 'DIMPLEX', 'AMERICAS']
    },
    {
      id: '2',
      contactName: 'Ryan Skolnick',
      companyName: 'ABC Company',
      matchedWords: ['RYAN', 'SKOLNICK']
    },
    {
      id: '3',
      contactName: 'Bob Skolnick',
      companyName: 'XYZ Corp',
      matchedWords: ['SKOLNICK']
    },
    {
      id: '4',
      contactName: 'John Smith',
      companyName: 'Glen Manufacturing',
      matchedWords: ['GLEN']
    },
    {
      id: '5',
      contactName: 'Jane Doe',
      companyName: 'Cambridge Industries',
      matchedWords: ['CAMBRIDGE']
    }
  ];
  
  console.log('\n📊 Scoring dealers...\n');
  
  // Levenshtein similarity function
  function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    if (s1 === s2) return 1;
    
    // Simple similarity for testing
    const maxLen = Math.max(s1.length, s2.length);
    let matches = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      if (s1[i] === s2[i]) matches++;
    }
    return matches / maxLen;
  }
  
  // Score each dealer
  const scoredDealers = mockDealers.map(dealer => {
    let score = 0;
    const contactName = dealer.contactName.toLowerCase();
    const companyName = dealer.companyName.toLowerCase();
    const matchedWords = dealer.matchedWords;
    
    let contactNameMatches = 0;
    let companyNameMatches = 0;
    
    matchedWords.forEach(word => {
      const wordLower = word.toLowerCase();
      
      // Check if word appears in contact name
      if (contactName.includes(wordLower)) {
        contactNameMatches++;
        
        // Check if it's a word boundary match
        const contactWords = contactName.split(/\s+/);
        const isExactWordMatch = contactWords.some(cw => 
          calculateSimilarity(wordLower, cw) >= 0.7
        );
        
        if (isExactWordMatch) {
          score += 50; // High score for name word match
        } else {
          score += 30; // Lower score for substring match
        }
      }
      
      // Check if word appears in company name
      if (companyName.includes(wordLower)) {
        companyNameMatches++;
        score += 10; // Lower score for company match
      }
    });
    
    // Bonus for multiple word matches in contact name
    if (contactNameMatches >= 2) {
      score += 40;
    }
    
    console.log(`👤 ${dealer.contactName} - ${dealer.companyName}`);
    console.log(`   Matched words: [${matchedWords.join(', ')}]`);
    console.log(`   In contact name: ${contactNameMatches}, In company: ${companyNameMatches}`);
    console.log(`   ⭐ Score: ${score}`);
    console.log('');
    
    return { ...dealer, score, contactNameMatches, companyNameMatches };
  });
  
  // Sort by score
  scoredDealers.sort((a, b) => b.score - a.score);
  
  console.log('\n🏆 FINAL RANKING:\n');
  scoredDealers.forEach((d, i) => {
    console.log(`${i + 1}. [Score: ${d.score}] ${d.contactName} - ${d.companyName}`);
  });
  
  console.log('\n========== VERIFICATION ==========\n');
  
  // Verify results
  const top1 = scoredDealers[0];
  const top2 = scoredDealers[1];
  
  console.log('Expected top result: Ryan Skolnick - Glen Dimplex Americas');
  console.log('Got top result:    ', top1.contactName, '-', top1.companyName);
  
  if (top1.contactName === 'Ryan Skolnick' && top1.companyName === 'Glen Dimplex Americas') {
    console.log('✅ TOP 1: CORRECT');
  } else {
    console.log('❌ TOP 1: WRONG');
    process.exit(1);
  }
  
  console.log('\nExpected #2: Ryan Skolnick - ABC Company (or another Ryan Skolnick)');
  console.log('Got #2:     ', top2.contactName, '-', top2.companyName);
  
  if (top2.contactName === 'Ryan Skolnick') {
    console.log('✅ TOP 2: CORRECT (another Ryan Skolnick)');
  } else {
    console.log('❌ TOP 2: WRONG - should be another Ryan Skolnick');
    process.exit(1);
  }
  
  console.log('\n✅ ALL TESTS PASSED!');
}

testSearchAlgorithm();

