/** Two qualifiers require at least two teams in every group. */
export function groupStructureError(teamCount: number, groupCount: number): string | null {
  if (!Number.isInteger(groupCount) || groupCount < 1 || groupCount > 16 || (groupCount & (groupCount - 1)) !== 0) {
    return "Group count must be 1, 2, 4, 8, or 16.";
  }
  if (!Number.isInteger(teamCount) || teamCount < groupCount * 2) {
    return `At least ${groupCount * 2} teams are required for ${groupCount} groups (2 teams per group).`;
  }
  return null;
}

export function balancedGroupCapacity(teamCount: number, groupCount: number, label: string): number {
  if (groupCount < 1) return 0;
  const index = label.charCodeAt(0) - 65;
  return Math.floor(teamCount / groupCount) + (index < teamCount % groupCount ? 1 : 0);
}