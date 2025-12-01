# Fuzzy Search Implementation Plan

## Goal
Implement typo-tolerant search that finds "Donna Skolnick" even when user types "Skulnik" or "Skulnick"

## Approach
1. Use JavaScript string similarity algorithm (Levenshtein distance)
2. Fetch all dealers for the company
3. Calculate similarity scores for each dealer
4. Return dealers with similarity above threshold
5. Keep existing exact/contains search as primary, add fuzzy as fallback

## Implementation Strategy
- Add string similarity utility function
- Modify dealers route to use fuzzy matching
- Maintain backward compatibility
- Test with various typos

## Why This Will Work
- No database extensions needed
- Works with existing Prisma setup
- Handles common typos (character swaps, missing letters, extra letters)
- Fast enough for typical dealer databases

