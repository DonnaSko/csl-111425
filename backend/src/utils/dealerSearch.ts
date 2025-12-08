/**
 * Shared dealer search utility with improved word-by-word matching
 * Used across all routes for consistent search behavior
 */

import { PrismaClient } from '@prisma/client';
import { fuzzyMatchDealer } from './fuzzySearch';

interface SearchDealersOptions {
  prisma: PrismaClient;
  companyId: string;
  baseWhere?: any;
  searchTerm: string;
  select?: any;
  take?: number;
  include?: any; // Note: if include is provided, select will be ignored
}

/**
 * Search dealers with improved word-by-word matching and semantic search
 * This function provides consistent search behavior across all routes
 */
export async function searchDealers({
  prisma,
  companyId,
  baseWhere = {},
  searchTerm,
  select,
  take = 100,
  include
}: SearchDealersOptions) {
  const trimmedSearch = searchTerm.trim();
  if (!trimmedSearch) {
    return [];
  }

  const searchLower = trimmedSearch.toLowerCase();
  const isSingleChar = trimmedSearch.length === 1;

  const where: any = {
    ...baseWhere,
    companyId
  };

  // For single character searches, use startsWith for better letter matching
  if (isSingleChar) {
    const exactWhere: any = {
      ...where,
      OR: [
        { companyName: { startsWith: trimmedSearch, mode: 'insensitive' } },
        { contactName: { startsWith: trimmedSearch, mode: 'insensitive' } },
        { contactName: { contains: ` ${trimmedSearch}`, mode: 'insensitive' } }, // Last names
        { email: { contains: trimmedSearch, mode: 'insensitive' } },
        { phone: { contains: trimmedSearch } },
        { buyingGroup: { contains: trimmedSearch, mode: 'insensitive' } }
      ]
    };

    const queryOptions: any = {
      where: exactWhere,
      take
    };
    
    if (include) {
      queryOptions.include = include;
    } else {
      queryOptions.select = select || {
        id: true,
        companyName: true,
        contactName: true,
        email: true,
        phone: true,
        status: true,
        buyingGroup: true
      };
    }
    
    const exactDealers = await prisma.dealer.findMany(queryOptions);

    if (exactDealers.length > 0) {
      return exactDealers;
    }

    // Fallback to fuzzy search for single character
    const fuzzyQueryOptions: any = {
      where,
      take: 500
    };
    
    if (include) {
      fuzzyQueryOptions.include = include;
    } else {
      fuzzyQueryOptions.select = select || {
        id: true,
        companyName: true,
        contactName: true,
        email: true,
        phone: true,
        status: true,
        buyingGroup: true
      };
    }
    
    const allDealers = await prisma.dealer.findMany(fuzzyQueryOptions);

    const fuzzyMatches = allDealers.filter((dealer: any) => {
      const groupNames = dealer.groups?.map((dg: any) => dg?.group?.name).join(' ') || '';
      return fuzzyMatchDealer(trimmedSearch, {
        companyName: dealer.companyName,
        contactName: dealer.contactName,
        email: dealer.email,
        phone: dealer.phone,
        buyingGroup: dealer.buyingGroup,
        groups: groupNames
      }, 0.4);
    });

    return fuzzyMatches.slice(0, take);
  }

  // Multi-character search - use semantic/fuzzy search with improved word-by-word matching
  // Fetch all dealers for the company (with filters applied)
  const multiCharQueryOptions: any = {
    where,
    take: 1000 // Get more for better fuzzy matching
  };
  
  if (include) {
    multiCharQueryOptions.include = include;
  } else {
    multiCharQueryOptions.select = select || {
      id: true,
      companyName: true,
      contactName: true,
      email: true,
      phone: true,
      status: true,
      buyingGroup: true
    };
  }
  
  const allDealers = await prisma.dealer.findMany(multiCharQueryOptions);

  // Apply semantic/fuzzy matching with improved word-by-word matching
  const fuzzyMatches = allDealers.filter((dealer: any) => {
    const groupNames = dealer.groups?.map((dg: any) => dg?.group?.name).join(' ') || '';
    const buyingGroupNames = dealer.buyingGroupHistory?.map((h: any) => h.buyingGroup.name).join(' ') || '';
    
    // First try exact contains match (faster for exact matches)
    if (dealer.companyName?.toLowerCase().includes(searchLower)) return true;
    
    // Check contact name - both full match and word-by-word (for last names like "Skolnick")
    if (dealer.contactName) {
      const contactLower = dealer.contactName.toLowerCase();
      if (contactLower.includes(searchLower)) return true;
      // Word-by-word check for last names (e.g., "Skolnick" in "Donna Skolnick")
      const words = contactLower.split(/\s+/);
      for (const word of words) {
        if (word === searchLower || word.includes(searchLower) || searchLower.includes(word)) {
          return true;
        }
      }
    }
    
    // Check other fields
    if (dealer.email?.toLowerCase().includes(searchLower)) return true;
    if (dealer.phone?.includes(trimmedSearch)) return true;
    if (dealer.buyingGroup?.toLowerCase().includes(searchLower)) return true;
    if (groupNames.toLowerCase().includes(searchLower)) return true;
    if (buyingGroupNames.toLowerCase().includes(searchLower)) return true;
    
    // Then try fuzzy/semantic matching for typos and partial matches
    return fuzzyMatchDealer(trimmedSearch, {
      companyName: dealer.companyName,
      contactName: dealer.contactName,
      email: dealer.email,
      phone: dealer.phone,
      buyingGroup: dealer.buyingGroup || buyingGroupNames,
      groups: groupNames
    }, 0.4); // 40% similarity threshold for better semantic matching
  });

  // Sort by relevance (exact matches first, then by creation date)
  fuzzyMatches.sort((a: any, b: any) => {
    const aExact = 
      (a.companyName?.toLowerCase().includes(searchLower) ||
       a.contactName?.toLowerCase().includes(searchLower)) ? 1 : 0;
    const bExact = 
      (b.companyName?.toLowerCase().includes(searchLower) ||
       b.contactName?.toLowerCase().includes(searchLower)) ? 1 : 0;
    
    if (aExact !== bExact) return bExact - aExact;
    
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return fuzzyMatches.slice(0, take);
}

