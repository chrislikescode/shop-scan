export function capitalizeFirstLetter(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // Example usage:
//   const capitalized = capitalizeFirstLetter('hello');
//   console.log(capitalized); // Output: 'Hello'
  