'use client';
import { ReferenceLink } from '@/types/audit';
import React from 'react';

interface Props {
  links?: ReferenceLink[];
  category: 'wcag' | 'security' | 'performance' | 'seo' | 'best-practice';
}

export function ReferenceLinks({ links, category }: Props) {
  if (!links || links.length === 0) {
    return null;
  }

  const categoryLinks = links.filter((link) => link.category === category);
  
  if (categoryLinks.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 mb-6">
      <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">Reference Resources</h4>
      <ul className="space-y-1 text-sm list-disc pl-5">
        {categoryLinks.map((link, idx) => (
          <li key={idx}>
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              {link.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}