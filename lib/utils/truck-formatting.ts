// Helper function to format category names for display
export function formatCategoryName(category: string): string {
  // Handle special cases
  if (category === "lcv") return "LCV";
  
  // Replace underscores with spaces and capitalize each word
  return category
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper function to format permit type names for display
export function formatPermitType(permitType: string): string {
  return permitType
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
