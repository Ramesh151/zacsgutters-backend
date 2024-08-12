const servicePrices = {
  gutterCleaning: {
    Garage: 40,
    Conservatory: 40,
    Extension: 40,
  },
  gutterRepairs: {
    "Running Outlet": 65,
    "Union Joint": 65,
    Corner: 65,
    "Gutter Bracket": 65,
    Downpipe: 65,
    "Gutter Length Replacement": 85,
  },
};

const housePrices = {
  Terrace: {
    Bungalow: 59,
    "2 bed House": 69,
    "3 bed House": 79,
    "4 bed House": 99,
    "5 bed House": 129,
    "Town House/3 Stories": 129,
  },
  "Semi-Detached": {
    Bungalow: 69,
    "2 bed House": 79,
    "3 bed House": 89,
    "4 bed House": 99,
    "5 bed House": 139,
    "Town House/3 Stories": 139,
  },
  Detached: {
    Bungalow: 79,
    "2 bed House": 89,
    "3 bed House": 99,
    "4 bed House": 119,
    "5 bed House": 149,
    "Town House/3 Stories": 149,
  },
};

export const calculateTotalPrice = (formData) => {
  let totalPrice = 0;

  // Calculate base price based on house type and style
  const basePrice =
    housePrices[formData.selectHomeStyle]?.[formData.selectHomeType];
  if (basePrice) {
    totalPrice += basePrice;
  }

  // Add prices for gutter cleaning options
  if (formData.selectService === "Gutter Cleaning") {
    formData.gutterCleaningOptions.forEach((option) => {
      totalPrice += servicePrices.gutterCleaning[option] || 0;
    });
  }

  // Add prices for gutter repair options
  if (formData.selectService === "Gutter Repair") {
    formData.gutterRepairsOptions.forEach((option) => {
      totalPrice += servicePrices.gutterRepairs[option] || 0;
    });
  }

  return totalPrice;
};

//+++++++++++++++++++++++++++++++++++++

// const VAT_RATE = 0.2; // 20% VAT

// // Prices for services
// const servicePrices = {
//   gutterCleaning: {
//     Garage: 40,
//     Conservatory: 40,
//     Extension: 40,
//   },
//   gutterRepairs: {
//     RunningOutlet: 65,
//     UnionJoint: 65,
//     Corner: 65,
//     GutterBracket: 65,
//     Downpipe: 65,
//     GutterLengthReplacement: 85,
//   },
// };

// // Prices for house types and styles
// const housePrices = {
//   Terrace: {
//     Bungalow: 59,
//     "2 bed House": 69,
//     "3 bed House": 79,
//     "4 bed House": 99,
//     "5 bed House": 129,
//     "Town House / 3 Stories": "BY QUOTE",
//   },
//   SemiDetached: {
//     Bungalow: 69,
//     "2 bed House": 79,
//     "3 bed House": 89,
//     "4 bed House": 99,
//     "5 bed House": 139,
//     "Town House / 3 Stories": "BY QUOTE",
//   },
//   Detached: {
//     Bungalow: 79,
//     "2 bed House": 89,
//     "3 bed House": 99,
//     "4 bed House": 119,
//     "5 bed House": 149,
//     "Town House / 3 Stories": "BY QUOTE",
//   },
// };

// // Function to calculate the price
// function calculatePrice(serviceType, serviceName, houseType, houseStyle) {
//   let price = 0;

//   // Check for service pricing
//   if (serviceType === "gutterCleaning" || serviceType === "gutterRepairs") {
//     if (servicePrices[serviceType][serviceName] !== undefined) {
//       price = servicePrices[serviceType][serviceName];
//     } else {
//       throw new Error("Invalid service name.");
//     }
//   } else if (serviceType === "houseCleaning") {
//     if (
//       housePrices[houseStyle] &&
//       housePrices[houseStyle][houseType] !== undefined
//     ) {
//       const housePrice = housePrices[houseStyle][houseType];
//       if (housePrice === "BY QUOTE") {
//         throw new Error("Price is by quote.");
//       }
//       price = housePrice;
//     } else {
//       throw new Error("Invalid house type or style.");
//     }
//   } else {
//     throw new Error("Invalid service type.");
//   }

//   // Add VAT
//   const totalPrice = price + price * VAT_RATE;
//   return totalPrice;
// }

// // Example usage
// try {
//   const serviceType = "gutterCleaning"; // or 'gutterRepairs'
//   const serviceName = "Garage"; // or other service names
//   const houseType = "2 bed House"; // relevant for house cleaning
//   const houseStyle = "Terrace"; // relevant for house cleaning

//   const price = calculatePrice(serviceType, serviceName, houseType, houseStyle);
//   console.log(`Total price including VAT: £${price.toFixed(2)}`);
// } catch (error) {
//   console.error(`Error calculating price: ${error.message}`);
// }

//*********************************** */

// export function calculatePrice(service, bedrooms, stories) {
//     let basePrice = 0;

//     switch(service) {
//       case "Gutter Cleaning":
//         basePrice = 50;
//         break;
//       case "Gutter Wash Down":
//         basePrice = 70;
//         break;
//       case "Gutter Repair":
//         basePrice = 100;
//         break;
//       case "Gutter Replacement":
//         basePrice = 200;
//         break;
//       case "Soffits and Fascias":
//         basePrice = 150;
//         break;
//       default:
//         throw new Error("Invalid service selected");
//     }

//     // Adjust price based on number of bedrooms
//     const bedroomFactor = 1 + (parseInt(bedrooms) - 1) * 0.1;

//     // Adjust price based on number of stories
//     const storyFactor = 1 + (parseInt(stories) - 1) * 0.2;

//     return Math.round(basePrice * bedroomFactor * storyFactor);
//   }
