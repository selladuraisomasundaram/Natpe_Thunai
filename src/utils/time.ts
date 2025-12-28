"use client";

import { format, differenceInDays, addYears, addMonths } from 'date-fns';

export const getGraduationData = (createdAt: string, yearOfStudy: string) => {
  const creationDate = new Date(createdAt);
  let graduationDate: Date;

  switch (yearOfStudy) {
    case 'I': // First Year: 4 years from creation
      graduationDate = addYears(creationDate, 4);
      break;
    case 'II': // Second Year: 3 years from creation
      graduationDate = addYears(creationDate, 3);
      break;
    case 'III': // Third Year: 2 years from creation
      graduationDate = addYears(creationDate, 2);
      break;
    case 'IV': // Fourth Year: 1 year from creation
    case 'V': // Fifth Year: 1 year from creation
    case 'Other': // Other: 1 year from creation
    default:
      graduationDate = addYears(creationDate, 1);
      break;
  }

  const now = new Date();
  const totalDays = differenceInDays(graduationDate, creationDate);
  const remainingDays = differenceInDays(graduationDate, now);

  const isGraduated = remainingDays <= 0;

  const daysPassed = totalDays - remainingDays;
  const progress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

  return {
    graduationDate: format(graduationDate, 'PPP'),
    remainingDays,
    totalDays,
    progress: Math.max(0, Math.min(100, progress)), // Ensure progress is between 0 and 100
    isGraduated,
  };
};

export const formatTimeRemaining = (days: number) => {
  if (days <= 0) {
    return 'Graduated!';
  }

  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainingDays = days % 30;

  let parts = [];
  if (years > 0) {
    parts.push(`${years} year${years > 1 ? 's' : ''}`);
  }
  if (months > 0) {
    parts.push(`${months} month${months > 1 ? 's' : ''}`);
  }
  if (remainingDays > 0 || parts.length === 0) { // Always show days if no years/months, or if there are remaining days
    parts.push(`${remainingDays} day${remainingDays > 1 ? 's' : ''}`);
  }

  return parts.join(', ');
};