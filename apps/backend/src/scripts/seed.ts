import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@spicekitchen.com' },
    update: {},
    create: {
      email: 'admin@spicekitchen.com',
      name: 'Spice Kitchen Admin',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('👤 Created admin user:', admin.email);

  // Create menu items
  const menuItems = [
    {
      name: 'Spiced Rice Bowl',
      description: 'Aromatic rice cooked with a blend of spices, tomatoes, and peppers. A flavorful and satisfying dish!',
      price: 1299, // $12.99 in cents
      category: 'MAIN' as const,
      imageUrl: 'https://example.com/images/spiced-rice.jpg',
      preparationTime: 15,
      ingredients: ['Rice', 'Tomatoes', 'Bell Peppers', 'Onions', 'Spices', 'Vegetable Stock'],
      calories: 320,
      protein: 8.5,
      carbs: 65.2,
      fat: 4.1,
      fiber: 2.3,
    },
    {
      name: 'Spicy Grilled Chicken',
      description: 'Tender grilled chicken marinated in our signature spice blend. Bold flavors that pack a punch!',
      price: 1699, // $16.99 in cents
      category: 'MAIN' as const,
      imageUrl: 'https://example.com/images/spicy-chicken.jpg',
      preparationTime: 20,
      ingredients: ['Chicken', 'Jalapeño Peppers', 'Ginger', 'Garlic', 'Onions', 'Spice Blend'],
      calories: 285,
      protein: 32.1,
      carbs: 3.2,
      fat: 15.8,
      fiber: 0.5,
    },
    {
      name: 'Spicy Beef Stir-Fry',
      description: 'Succulent beef strips stir-fried with peppers and our signature spicy sauce. A protein-packed favorite!',
      price: 1899, // $18.99 in cents
      category: 'MAIN' as const,
      imageUrl: 'https://example.com/images/spicy-beef.jpg',
      preparationTime: 25,
      ingredients: ['Beef', 'Bell Peppers', 'Jalapeños', 'Tomatoes', 'Onions', 'Garlic', 'Ginger'],
      calories: 340,
      protein: 28.5,
      carbs: 5.1,
      fat: 22.3,
      fiber: 1.2,
    },
    {
      name: 'Cajun Spiced Lamb',
      description: 'Premium lamb cuts seasoned with traditional Cajun spices. A bold and adventurous choice!',
      price: 2299, // $22.99 in cents
      category: 'MAIN' as const,
      imageUrl: 'https://example.com/images/cajun-lamb.jpg',
      preparationTime: 30,
      ingredients: ['Lamb', 'Cajun Spice Mix', 'Traditional Herbs', 'Onions', 'Garlic', 'Ginger'],
      calories: 310,
      protein: 26.8,
      carbs: 2.8,
      fat: 20.5,
      fiber: 0.8,
    },
    {
      name: 'Blackened Fish',
      description: 'Fresh fish fillet blackened with our special spice rub. Light, flaky, and full of flavor!',
      price: 1799, // $17.99 in cents
      category: 'MAIN' as const,
      imageUrl: 'https://example.com/images/blackened-fish.jpg',
      preparationTime: 18,
      ingredients: ['Fresh Fish', 'Blackening Spices', 'Lemon', 'Herbs', 'Garlic', 'Ginger'],
      calories: 220,
      protein: 35.2,
      carbs: 2.1,
      fat: 8.5,
      fiber: 0.3,
    },
    {
      name: 'Sweet Potato Fries',
      description: 'Crispy sweet potato fries seasoned with our signature spice blend. The perfect side dish!',
      price: 699, // $6.99 in cents
      category: 'SIDE' as const,
      imageUrl: 'https://example.com/images/sweet-potato-fries.jpg',
      preparationTime: 10,
      ingredients: ['Sweet Potatoes', 'Olive Oil', 'Sea Salt', 'Spice Blend'],
      calories: 180,
      protein: 1.8,
      carbs: 38.5,
      fat: 5.2,
      fiber: 3.1,
    },
    {
      name: 'Spiced Rice + Grilled Chicken Combo',
      description: 'Our signature spiced rice paired with tender grilled chicken. The ultimate comfort meal!',
      price: 2199, // $21.99 in cents (discounted from $24.98)
      category: 'COMBO' as const,
      imageUrl: 'https://example.com/images/rice-chicken-combo.jpg',
      preparationTime: 25,
      ingredients: ['Spiced Rice', 'Grilled Chicken', 'Side Salad'],
      calories: 605,
      protein: 40.6,
      carbs: 68.4,
      fat: 19.9,
      fiber: 2.8,
    },
    {
      name: 'Rice Bowl + Sweet Potato Fries Combo',
      description: 'Classic spiced rice with crispy sweet potato fries. A delicious vegetarian-friendly option!',
      price: 1599, // $15.99 in cents (discounted from $19.98)
      category: 'COMBO' as const,
      imageUrl: 'https://example.com/images/rice-fries-combo.jpg',
      preparationTime: 20,
      ingredients: ['Spiced Rice', 'Sweet Potato Fries', 'Dipping Sauce'],
      calories: 500,
      protein: 10.3,
      carbs: 103.7,
      fat: 9.3,
      fiber: 5.4,
    },
  ];

  for (const item of menuItems) {
    const menuItem = await prisma.menuItem.upsert({
      where: { name: item.name },
      update: item,
      create: item,
    });
    console.log(`🍽️  Created menu item: ${menuItem.name}`);
  }

  // Create system settings
  const settings = [
    { key: 'restaurant_name', value: 'Spice Kitchen' },
    { key: 'restaurant_phone', value: '+1-555-123-4567' },
    { key: 'restaurant_address', value: '123 Main Street, New York, NY 10001' },
    { key: 'tax_rate', value: '0.08' }, // 8% sales tax (typical US rate)
    { key: 'delivery_fee', value: '299' }, // $2.99 in cents
    { key: 'minimum_order', value: '1500' }, // $15.00 in cents
    { key: 'operating_hours', value: '{"open": "11:00", "close": "22:00"}' },
    { key: 'is_open', value: 'true' },
    { key: 'currency', value: 'USD' },
    { key: 'timezone', value: 'America/New_York' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
    console.log(`⚙️  Created setting: ${setting.key}`);
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });