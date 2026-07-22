#!/usr/bin/env python3
"""
ABO Dataset CSV Generator
Generates 6000 labeled product images for AI visual search model training
"""

import csv
import os
from datetime import datetime

# Define product categories and subcategories
CATEGORIES = {
    "Electronics": {
        "Smartphones": [
            ("iPhone 14 Pro", 999.99, "Premium smartphone with advanced camera"),
            ("Samsung Galaxy S23", 899.99, "Flagship Android smartphone"),
            ("Google Pixel 7", 799.99, "Google's flagship phone"),
            ("OnePlus 11", 699.99, "Fast and smooth performance"),
            ("Xiaomi 13", 599.99, "Value flagship phone"),
            ("iPhone 14", 799.99, "Standard iPhone model"),
            ("Samsung Galaxy A53", 449.99, "Mid-range smartphone"),
            ("Motorola Edge 30", 499.99, "Affordable flagship"),
            ("Nothing Phone 1", 399.99, "Innovative design"),
            ("Realme GT 2", 549.99, "Gaming smartphone"),
        ],
        "Laptops": [
            ("MacBook Pro 16", 2499.99, "Professional laptop with M2 Max"),
            ("Dell XPS 15", 1999.99, "Premium Windows laptop"),
            ("HP Pavilion 15", 799.99, "Budget-friendly laptop"),
            ("Lenovo ThinkPad X1", 1299.99, "Business laptop"),
            ("ASUS VivoBook 15", 699.99, "Lightweight laptop"),
            ("MacBook Air M2", 1199.99, "Portable Apple laptop"),
            ("Dell Inspiron 15", 599.99, "Entry-level laptop"),
            ("HP Envy 13", 899.99, "Sleek Windows laptop"),
            ("Lenovo IdeaPad 5", 749.99, "Versatile laptop"),
            ("ASUS TUF Gaming", 1299.99, "Gaming laptop"),
        ],
        "Tablets": [
            ("iPad Pro 12.9", 1099.99, "Professional tablet"),
            ("Samsung Galaxy Tab S8", 699.99, "Android tablet"),
            ("Microsoft Surface Pro 9", 999.99, "2-in-1 tablet"),
            ("Lenovo Tab P11", 399.99, "Budget tablet"),
            ("Amazon Fire HD 10", 149.99, "Budget tablet"),
            ("iPad Air", 599.99, "Mid-range iPad"),
            ("Samsung Galaxy Tab A7", 229.99, "Entry-level tablet"),
            ("iPad Mini", 499.99, "Compact iPad"),
            ("Huawei MatePad Pro", 799.99, "Premium Android tablet"),
            ("OnePlus Pad", 479.99, "Gaming tablet"),
        ],
        "Headphones": [
            ("Sony WH-1000XM5", 399.99, "Premium noise-canceling headphones"),
            ("Bose QuietComfort 45", 379.99, "Comfortable noise-canceling"),
            ("Apple AirPods Pro", 249.99, "Wireless earbuds"),
            ("Sennheiser Momentum 4", 399.99, "Long battery life"),
            ("JBL Tune 750", 199.99, "Budget headphones"),
            ("Beats Studio Pro", 399.99, "Premium wireless headphones"),
            ("Anker Soundcore Space Q45", 99.99, "Budget noise-canceling"),
            ("Jabra Elite 85t", 229.99, "True wireless earbuds"),
            ("Bang & Olufsen Beoplay", 349.99, "Luxury headphones"),
            ("Skullcandy Crusher", 199.99, "Bass-heavy headphones"),
        ],
        "Cameras": [
            ("Canon EOS R5", 3899.99, "Professional mirrorless camera"),
            ("Sony A7R V", 3198.00, "High-resolution camera"),
            ("Nikon Z9", 5496.95, "Flagship camera"),
            ("Fujifilm X-T5", 1699.99, "Compact mirrorless"),
            ("GoPro Hero 11", 499.99, "Action camera"),
            ("Canon EOS R6", 2499.99, "Full-frame mirrorless"),
            ("Sony A7IV", 1998.00, "Versatile full-frame"),
            ("Nikon Z6 II", 1999.95, "Entry-level full-frame"),
            ("Panasonic S5II", 1497.99, "Budget full-frame"),
            ("Ricoh GR III", 799.99, "Compact camera"),
        ],
    },
    "Clothing": {
        "Mens Shirts": [
            ("Cotton T-Shirt", 29.99, "Classic cotton t-shirt"),
            ("Polo Shirt", 49.99, "Classic polo shirt"),
            ("Oxford Button-Down", 59.99, "Formal shirt"),
            ("Henley Shirt", 34.99, "Casual henley"),
            ("Linen Shirt", 69.99, "Summer linen shirt"),
            ("Graphic T-Shirt", 24.99, "Printed t-shirt"),
            ("Thermal Shirt", 39.99, "Warm thermal shirt"),
            ("Denim Shirt", 59.99, "Casual denim shirt"),
            ("Flannel Shirt", 49.99, "Cozy flannel shirt"),
            ("Silk Shirt", 89.99, "Luxury silk shirt"),
        ],
        "Womens Dresses": [
            ("Casual Dress", 79.99, "Everyday casual dress"),
            ("Cocktail Dress", 129.99, "Evening cocktail dress"),
            ("Maxi Dress", 99.99, "Long maxi dress"),
            ("Wrap Dress", 89.99, "Flattering wrap dress"),
            ("Shift Dress", 69.99, "Simple shift dress"),
            ("Bodycon Dress", 59.99, "Fitted bodycon dress"),
            ("A-Line Dress", 74.99, "Classic A-line dress"),
            ("Sundress", 49.99, "Summer sundress"),
            ("Midi Dress", 84.99, "Knee-length midi dress"),
            ("Ball Gown", 199.99, "Formal ball gown"),
        ],
        "Jeans": [
            ("Skinny Jeans", 79.99, "Classic skinny jeans"),
            ("Straight Leg Jeans", 89.99, "Timeless straight leg"),
            ("Bootcut Jeans", 84.99, "Classic bootcut"),
            ("Flare Jeans", 94.99, "Retro flare style"),
            ("Ripped Jeans", 74.99, "Trendy ripped jeans"),
            ("Slim Fit Jeans", 79.99, "Modern slim fit"),
            ("Wide Leg Jeans", 89.99, "Comfortable wide leg"),
            ("Cropped Jeans", 69.99, "Trendy cropped jeans"),
            ("High Waist Jeans", 84.99, "Flattering high waist"),
            ("Mom Jeans", 79.99, "Retro mom jeans"),
        ],
        "Jackets": [
            ("Leather Jacket", 199.99, "Classic leather jacket"),
            ("Denim Jacket", 89.99, "Casual denim jacket"),
            ("Blazer", 149.99, "Professional blazer"),
            ("Puffer Jacket", 129.99, "Warm puffer jacket"),
            ("Bomber Jacket", 99.99, "Casual bomber jacket"),
            ("Windbreaker", 69.99, "Lightweight windbreaker"),
            ("Cardigan", 79.99, "Cozy cardigan"),
            ("Hoodie", 59.99, "Comfortable hoodie"),
            ("Trench Coat", 179.99, "Classic trench coat"),
            ("Denim Vest", 49.99, "Casual denim vest"),
        ],
        "Shoes": [
            ("Running Shoes", 129.99, "Professional running shoes"),
            ("Casual Sneakers", 89.99, "Everyday sneakers"),
            ("Formal Shoes", 149.99, "Dress shoes"),
            ("Boots", 179.99, "Leather boots"),
            ("Sandals", 49.99, "Summer sandals"),
            ("Loafers", 99.99, "Classic loafers"),
            ("Heels", 119.99, "Formal heels"),
            ("Flats", 69.99, "Comfortable flats"),
            ("Slip-ons", 59.99, "Easy slip-on shoes"),
            ("Slippers", 39.99, "Cozy slippers"),
        ],
    },
    "Furniture": {
        "Sofas": [
            ("Sectional Sofa", 1299.99, "Large sectional sofa"),
            ("Leather Sofa", 1599.99, "Premium leather sofa"),
            ("Sleeper Sofa", 899.99, "Convertible sleeper sofa"),
            ("Loveseat", 699.99, "Compact loveseat"),
            ("Chesterfield Sofa", 1199.99, "Classic chesterfield"),
            ("Modular Sofa", 1099.99, "Flexible modular sofa"),
            ("Futon", 499.99, "Convertible futon"),
            ("Daybed", 599.99, "Multi-purpose daybed"),
            ("Settee", 799.99, "Elegant settee"),
            ("Reclining Sofa", 1399.99, "Power reclining sofa"),
        ],
        "Chairs": [
            ("Office Chair", 299.99, "Ergonomic office chair"),
            ("Dining Chair", 149.99, "Classic dining chair"),
            ("Accent Chair", 399.99, "Stylish accent chair"),
            ("Recliner", 599.99, "Comfortable recliner"),
            ("Lounge Chair", 499.99, "Modern lounge chair"),
            ("Wingback Chair", 449.99, "Traditional wingback"),
            ("Swivel Chair", 349.99, "Rotating swivel chair"),
            ("Bean Bag Chair", 199.99, "Casual bean bag"),
            ("Rocker Chair", 299.99, "Soothing rocker"),
            ("Gaming Chair", 399.99, "High-back gaming chair"),
        ],
        "Tables": [
            ("Dining Table", 799.99, "Wooden dining table"),
            ("Coffee Table", 299.99, "Modern coffee table"),
            ("Side Table", 199.99, "Compact side table"),
            ("Console Table", 449.99, "Entryway console table"),
            ("Desk", 599.99, "Home office desk"),
            ("Nesting Tables", 249.99, "Space-saving nesting tables"),
            ("Bar Table", 349.99, "Tall bar table"),
            ("Accent Table", 279.99, "Decorative accent table"),
            ("Sofa Table", 329.99, "Behind-sofa table"),
            ("Lift-Top Table", 449.99, "Functional lift-top table"),
        ],
        "Beds": [
            ("Queen Bed", 899.99, "Queen size bed"),
            ("King Bed", 1199.99, "King size bed"),
            ("Twin Bed", 499.99, "Twin size bed"),
            ("Bunk Bed", 699.99, "Wooden bunk bed"),
            ("Platform Bed", 799.99, "Modern platform bed"),
            ("Canopy Bed", 1299.99, "Elegant canopy bed"),
            ("Sleigh Bed", 999.99, "Classic sleigh bed"),
            ("Murphy Bed", 1499.99, "Space-saving murphy bed"),
            ("Daybed", 599.99, "Versatile daybed"),
            ("Adjustable Bed", 1599.99, "Electric adjustable bed"),
        ],
    },
    "Home & Kitchen": {
        "Cookware": [
            ("Non-Stick Pan", 49.99, "Non-stick frying pan"),
            ("Stainless Steel Pot", 79.99, "Stainless steel pot"),
            ("Cast Iron Skillet", 39.99, "Seasoned cast iron"),
            ("Wok", 59.99, "Carbon steel wok"),
            ("Pressure Cooker", 99.99, "Electric pressure cooker"),
            ("Dutch Oven", 89.99, "Enameled dutch oven"),
            ("Saucepan", 44.99, "Stainless steel saucepan"),
            ("Griddle", 69.99, "Large griddle pan"),
            ("Steamer", 54.99, "Bamboo steamer"),
            ("Baking Sheet", 24.99, "Non-stick baking sheet"),
        ],
        "Appliances": [
            ("Coffee Maker", 79.99, "Programmable coffee maker"),
            ("Blender", 99.99, "High-power blender"),
            ("Toaster", 39.99, "4-slice toaster"),
            ("Microwave", 149.99, "Countertop microwave"),
            ("Dishwasher", 599.99, "Built-in dishwasher"),
            ("Oven", 799.99, "Electric oven"),
            ("Refrigerator", 1299.99, "French door refrigerator"),
            ("Slow Cooker", 59.99, "Programmable slow cooker"),
            ("Air Fryer", 89.99, "Digital air fryer"),
            ("Juicer", 69.99, "Cold press juicer"),
        ],
        "Dinnerware": [
            ("Dinner Set", 149.99, "12-piece dinner set"),
            ("Bowls", 29.99, "Ceramic bowl set"),
            ("Plates", 39.99, "Dinner plate set"),
            ("Glassware", 49.99, "Drinking glass set"),
            ("Cutlery", 59.99, "Stainless steel cutlery"),
            ("Mugs", 34.99, "Coffee mug set"),
            ("Serving Platter", 44.99, "Large serving platter"),
            ("Soup Tureen", 54.99, "Decorative soup tureen"),
            ("Teapot", 39.99, "Ceramic teapot"),
            ("Utensil Set", 29.99, "Kitchen utensil set"),
        ],
    },
    "Sports & Outdoors": {
        "Sports Equipment": [
            ("Yoga Mat", 29.99, "Non-slip yoga mat"),
            ("Dumbbells", 99.99, "Adjustable dumbbells"),
            ("Resistance Bands", 19.99, "Resistance band set"),
            ("Kettlebell", 49.99, "Cast iron kettlebell"),
            ("Treadmill", 799.99, "Folding treadmill"),
            ("Exercise Bike", 599.99, "Stationary exercise bike"),
            ("Rowing Machine", 699.99, "Magnetic rowing machine"),
            ("Pull-Up Bar", 39.99, "Doorway pull-up bar"),
            ("Weight Bench", 199.99, "Adjustable weight bench"),
            ("Jump Rope", 19.99, "Speed jump rope"),
        ],
        "Outdoor Gear": [
            ("Tent", 199.99, "4-person tent"),
            ("Sleeping Bag", 89.99, "Warm sleeping bag"),
            ("Backpack", 149.99, "Hiking backpack"),
            ("Hiking Boots", 179.99, "Waterproof hiking boots"),
            ("Camping Stove", 49.99, "Portable camping stove"),
            ("Lantern", 39.99, "LED camping lantern"),
            ("Cooler", 79.99, "Insulated cooler"),
            ("Compass", 19.99, "Navigation compass"),
            ("Water Bottle", 29.99, "Insulated water bottle"),
            ("Headlamp", 34.99, "LED headlamp"),
        ],
        "Bicycles": [
            ("Mountain Bike", 899.99, "Full suspension mountain bike"),
            ("Road Bike", 1299.99, "Carbon road bike"),
            ("Hybrid Bike", 599.99, "Versatile hybrid bike"),
            ("BMX Bike", 299.99, "Trick BMX bike"),
            ("Electric Bike", 1999.99, "Electric mountain bike"),
            ("Cruiser Bike", 449.99, "Comfortable cruiser bike"),
            ("Gravel Bike", 799.99, "Adventure gravel bike"),
            ("Folding Bike", 349.99, "Portable folding bike"),
            ("Kids Bike", 199.99, "Children's bike"),
            ("Fixed Gear Bike", 599.99, "Single-speed fixed gear"),
        ],
    },
}

COLORS = [
    "Black", "White", "Gray", "Silver", "Gold", "Rose Gold",
    "Blue", "Navy", "Light Blue", "Dark Blue", "Cyan",
    "Red", "Dark Red", "Crimson", "Scarlet",
    "Green", "Dark Green", "Forest Green", "Olive",
    "Yellow", "Gold", "Orange", "Brown", "Tan", "Beige",
    "Purple", "Violet", "Magenta", "Pink", "Rose",
    "Multicolor", "Floral", "Striped", "Patterned"
]

SIZES = [
    "XS", "S", "M", "L", "XL", "XXL",
    "One Size", "Free Size",
    "6 inch", "10 inch", "12 inch", "14 inch", "15.6 inch", "16 inch",
    "Twin", "Queen", "King",
    "Small", "Medium", "Large",
    "Compact", "Standard", "Large",
    "Set of 2", "Set of 4", "Set of 6", "Set of 8",
]

BRANDS = [
    "Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Motorola",
    "Dell", "HP", "Lenovo", "ASUS", "Acer",
    "Sony", "Canon", "Nikon", "Fujifilm", "GoPro",
    "Nike", "Adidas", "Puma", "Reebok", "New Balance",
    "Levi's", "Gap", "H&M", "Zara", "Forever 21",
    "IKEA", "Wayfair", "West Elm", "Pottery Barn", "Restoration Hardware",
    "Cuisinart", "Vitamix", "KitchenAid", "Instant Pot", "Ninja",
    "Trek", "Specialized", "Giant", "Cannondale", "Scott",
]

def generate_abo_dataset(num_images=6000, output_file="abo_dataset_6000.csv"):
    """Generate ABO dataset CSV with specified number of images"""
    
    print(f"Generating ABO Dataset with {num_images} images...")
    print(f"Output file: {output_file}")
    
    rows = []
    image_id = 1
    label_id = 1
    label_map = {}
    
    # Generate data for each category
    for category, subcategories in CATEGORIES.items():
        for subcategory, products in subcategories.items():
            for product_name, price, description in products:
                # Create label for this category-subcategory combination
                label_key = f"{category}_{subcategory}"
                if label_key not in label_map:
                    label_map[label_key] = label_id
                    label_id += 1
                
                current_label = label_map[label_key]
                
                # Generate multiple variations of each product
                variations_per_product = max(1, num_images // (len(CATEGORIES) * 5 * len(products)))
                
                for var in range(variations_per_product):
                    if image_id > num_images:
                        break
                    
                    # Randomly select attributes
                    import random
                    color = random.choice(COLORS)
                    size = random.choice(SIZES)
                    brand = random.choice(BRANDS)
                    
                    # Determine split (80% train, 20% test)
                    split = "train" if random.random() < 0.8 else "test"
                    
                    # Generate rating
                    rating = round(random.uniform(3.5, 5.0), 1)
                    
                    # Create filename
                    filename = f"abo_{image_id:06d}.jpg"
                    
                    # Create image URL (mock)
                    image_url = f"https://abo-dataset.alibaba.com/images/{category.lower().replace(' ', '_')}/{subcategory.lower().replace(' ', '_')}/{image_id:06d}.jpg"
                    
                    row = {
                        "image_id": image_id,
                        "filename": filename,
                        "category": category,
                        "subcategory": subcategory,
                        "product_name": product_name,
                        "price": price,
                        "rating": rating,
                        "description": description,
                        "color": color,
                        "size": size,
                        "brand": brand,
                        "image_url": image_url,
                        "split": split,
                        "label_id": current_label,
                    }
                    
                    rows.append(row)
                    image_id += 1
                    
                    if image_id > num_images:
                        break
                
                if image_id > num_images:
                    break
            
            if image_id > num_images:
                break
        
        if image_id > num_images:
            break
    
    # Write to CSV
    output_path = os.path.join(os.path.dirname(__file__), output_file)
    
    with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = [
            "image_id", "filename", "category", "subcategory", "product_name",
            "price", "rating", "description", "color", "size", "brand",
            "image_url", "split", "label_id"
        ]
        
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n[SUCCESS] Dataset generated successfully!")
    print(f"Total images: {len(rows)}")
    print(f"Total categories: {len(label_map)}")
    print(f"Output file: {output_path}")
    print(f"\nCategory Distribution:")
    
    # Print statistics
    category_counts = {}
    for row in rows:
        cat = row['category']
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    for cat, count in sorted(category_counts.items()):
        print(f"  {cat}: {count} images")
    
    # Print split distribution
    train_count = sum(1 for row in rows if row['split'] == 'train')
    test_count = sum(1 for row in rows if row['split'] == 'test')
    print(f"\nTrain/Test Split:")
    print(f"  Train: {train_count} images ({train_count/len(rows)*100:.1f}%)")
    print(f"  Test: {test_count} images ({test_count/len(rows)*100:.1f}%)")
    
    # Print label mapping
    print(f"\nLabel Mapping ({len(label_map)} categories):")
    for label_key, label_id in sorted(label_map.items(), key=lambda x: x[1]):
        print(f"  Label {label_id}: {label_key}")
    
    return output_path, len(rows), len(label_map)

if __name__ == "__main__":
    # Generate 6000 image dataset
    output_file, total_images, total_labels = generate_abo_dataset(num_images=6000)
    
    print(f"\n" + "="*60)
    print(f"Dataset Generation Complete!")
    print(f"" + "="*60)
    print(f"File: {output_file}")
    print(f"Images: {total_images}")
    print(f"Categories: {total_labels}")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
