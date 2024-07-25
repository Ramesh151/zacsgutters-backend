// utils/priceCalculator.js
export function calculatePrice(service, bedrooms, stories) {
    let basePrice = 0;
    
    switch(service) {
      case "Gutter Cleaning":
        basePrice = 50;
        break;
      case "Gutter Wash Down":
        basePrice = 70;
        break;
      case "Gutter Repair":
        basePrice = 100;
        break;
      case "Gutter Replacement":
        basePrice = 200;
        break;
      case "Soffits and Fascias":
        basePrice = 150;
        break;
      default:
        throw new Error("Invalid service selected");
    }
  
    // Adjust price based on number of bedrooms
    const bedroomFactor = 1 + (parseInt(bedrooms) - 1) * 0.1;
  
    // Adjust price based on number of stories
    const storyFactor = 1 + (parseInt(stories) - 1) * 0.2;
  
    return Math.round(basePrice * bedroomFactor * storyFactor);
  }