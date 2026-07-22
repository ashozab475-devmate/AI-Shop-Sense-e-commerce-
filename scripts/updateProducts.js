const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
    { id: 'mock-sh-7', name: 'SafeGuard Smoke & CO Detector', description: 'Advanced dual-sensor detector with smartphone alerts. Monitors smoke and carbon monoxide 24/7 with precise location tracking.' },
    { id: 'mock-sh-9', name: 'SmartFlow Garden Controller', description: 'Weather-adaptive irrigation system that optimizes watering schedules. Saves up to 50% water while maintaining a lush, healthy lawn.' },
    { id: 'mock-sh-10', name: 'SolarShade Motorized Blinds', description: 'App-controlled window blinds with solar charging capability. Automatically adjust to sunlight intensity and time of day for energy efficiency.' },
    { id: 'mock-sh-13', name: 'ChromaSync LED Light Strip', description: '16.4ft smart RGB LED strip with music sync and voice control. Create dynamic lighting scenes with 16 million color options.' },
    { id: 'mock-sh-14', name: 'iPhone', description: 'Apple iPhone — a powerful smartphone with a stunning display, advanced camera system, and seamless performance.' },
    { id: 'mock-sh-15', name: 'SecureAccess Smart Garage Hub', description: 'WiFi garage door controller with real-time alerts and remote access. Monitor and control your garage from anywhere via smartphone app.' },
    { id: 'mock-sh-16', name: 'PawView Pet Camera Pro', description: 'Interactive pet camera with 1080p HD video, two-way audio, and treat dispenser. Night vision and motion alerts keep you connected to your pet.' },
    { id: 'mock-sh-17', name: 'VitalTrack Smart Scale', description: 'Bluetooth body composition analyzer tracking 13 key metrics. Syncs with fitness apps to monitor weight, BMI, body fat, and muscle mass.' },
    { id: 'mock-5', name: 'ThermoFlask Insulated Bottle', description: 'Double-wall vacuum insulated stainless steel bottle. Keeps beverages cold for 24 hours or hot for 12 hours. BPA-free and leak-proof design.' },
    { id: 'mock-wl-1', name: 'ZenFlow Premium Yoga Mat', description: 'Extra-thick 6mm TPE yoga mat with superior grip and cushioning. Eco-friendly, non-toxic material with alignment marks and carrying strap.' },
    { id: 'mock-wl-4', name: 'Mindful Meditation Cushion', description: 'Organic cotton zafu filled with natural buckwheat hulls. Ergonomic design promotes proper posture for extended meditation sessions.' },
    { id: 'mock-wl-5', name: 'FlexFit Resistance Band Kit', description: 'Complete 5-band set with varying resistance levels (10-50 lbs). Includes door anchor, handles, and ankle straps for full-body workouts.' },
    { id: 'mock-wl-7', name: 'AromaTherapy Essential Oil Collection', description: 'Premium set of 6 pure essential oils: Lavender, Peppermint, Eucalyptus, Tea Tree, Lemon, and Frankincense. Therapeutic grade for diffusion and topical use.' },
    { id: 'mock-wl-11', name: 'CloudComfort Weighted Blanket', description: '15lb cooling weighted blanket with breathable cotton cover. Evenly distributed glass beads provide gentle pressure for deeper, more restful sleep.' },
    { id: 'mock-wl-13', name: 'Serenity Herbal Tea Collection', description: 'Curated assortment of 12 organic herbal teas. Caffeine-free blends for relaxation, digestion, and wellness. Includes chamomile, peppermint, and ginger.' },
    { id: 'mock-wl-14', name: 'EcoBalance Cork Yoga Block', description: 'Sustainable natural cork yoga block with rounded edges. Provides stable support for poses while being lightweight, antimicrobial, and eco-friendly.' },
    { id: 'mock-wl-15', name: 'ToneFlex Pilates Ring', description: 'Dual-grip resistance ring for targeted muscle toning. Padded foam handles ensure comfort during core, arm, and leg exercises.' },
    { id: 'mock-wl-16', name: 'QuickTemp Infrared Thermometer', description: 'Medical-grade non-contact thermometer with instant 1-second readings. Accurate fever detection with memory recall for up to 32 readings.' },
    { id: 'mock-ws-1', name: 'ErgoLux Executive Chair', description: 'Premium mesh office chair with 4D adjustable armrests and lumbar support. Breathable design with tilt mechanism for all-day ergonomic comfort.' },
    { id: 'mock-ws-2', name: 'StrikeForce Mechanical Keyboard', description: 'Gaming keyboard with hot-swappable mechanical switches and per-key RGB lighting. Programmable macros and aluminum frame for durability.' },
    { id: 'mock-ws-3', name: 'VisionPro 34" Curved Monitor', description: 'UWQHD 3440x1440 ultrawide curved display with 100Hz refresh rate. Perfect for multitasking, gaming, and creative work with HDR support.' },
    { id: 'mock-ws-5', name: 'UrbanTech Laptop Backpack', description: 'Water-resistant commuter backpack with padded 15.6" laptop compartment. USB charging port, anti-theft pocket, and ergonomic shoulder straps.' },
    { id: 'mock-ws-6', name: 'VintageSound Bluetooth Speaker', description: 'Retro-styled portable speaker with modern 360° sound technology. 12-hour battery life, wireless connectivity, and premium wood finish.' },
    { id: 'mock-ws-7', name: 'RiseUp Desk Converter', description: 'Height-adjustable standing desk riser with gas spring lift system. Dual-tier design accommodates monitor and keyboard with smooth transitions.' },
    { id: 'mock-ws-8', name: 'ErgoGrip Vertical Mouse', description: 'Wireless vertical mouse with natural handshake position. Reduces wrist strain and carpal tunnel risk with 6 programmable buttons and adjustable DPI.' },
    { id: 'mock-ws-9', name: 'SilentZone ANC Headphones', description: 'Premium over-ear headphones with active noise cancellation and 30-hour battery. Studio-quality sound with comfortable memory foam cushions.' },
    { id: 'mock-ws-10', name: 'DeskPro Organizer System', description: 'Complete 5-piece mesh desk organizer set. Includes letter tray, pen holder, drawer organizer, and accessories tray for clutter-free workspace.' },
    { id: 'mock-ws-17', name: 'ProCalc Mechanical Numpad', description: 'Wireless mechanical number pad with tactile switches. Perfect for data entry, accounting, and spreadsheet work with 18-key layout.' },
    { id: 'mock-ws-18', name: 'LuxeDesk Leather Mat', description: 'Premium vegan leather desk pad (31.5" x 15.7"). Water-resistant surface protects desk while providing smooth glide for mouse and keyboard.' },
    { id: 'mock-ws-20', name: 'CoolFlow Laptop Cooling Stand', description: 'Adjustable laptop cooler with 3 ultra-quiet fans. Ergonomic height settings and dual USB ports keep your device cool and comfortable.' },
    { id: 'new-sh-2', name: 'BrewMaster Smart Coffee Maker', description: 'WiFi-enabled programmable coffee maker with app control. Schedule brewing, adjust strength, and get notifications when your coffee is ready.' },
    { id: 'new-ws-1', name: 'InfinityView 34" Ultrawide', description: 'Curved IPS ultrawide monitor with 3440x1440 resolution. 99% sRGB color accuracy ideal for designers, editors, and multitasking professionals.' },
    { id: 'new-ws-2', name: 'FlexiRise Electric Standing Desk', description: 'Dual-motor height-adjustable desk (29"-48") with 4 memory presets. Solid bamboo top, anti-collision system, and cable management tray.' },
    { id: 'new-wl-1', name: 'HydraGlow Smart Water Bottle', description: 'LED smart bottle that tracks hydration goals and glows as reminders. BPA-free with temperature display and 24-hour insulation.' },
    { id: 'new-wl-2', name: 'ZenSeat Meditation Cushion', description: 'Crescent-shaped meditation cushion with organic buckwheat fill. Promotes proper spinal alignment and comfortable cross-legged sitting.' },
    { id: 'new-au-1', name: 'ClassicSpin Vinyl Turntable', description: 'Belt-drive record player with built-in preamp and Bluetooth output. Plays 33/45/78 RPM records with adjustable counterweight and anti-skate.' },
    { id: 'new-od-1', name: 'SummitPro 2-Person Tent', description: 'Lightweight 3-season backpacking tent (4.5 lbs). Waterproof rainfly, aluminum poles, and vestibule storage for gear protection.' },
    { id: 'new-od-2', name: 'TrailBlaze Portable Grill', description: 'Compact folding charcoal grill with stainless steel construction. Perfect for camping, tailgating, and beach cookouts with easy setup.' }
];

async function updateProducts() {
    console.log('Updating product names and descriptions...\n');
    
    for (const update of updates) {
        try {
            await prisma.product.update({
                where: { id: update.id },
                data: {
                    name: update.name,
                    description: update.description
                }
            });
            console.log(`✅ Updated: ${update.name}`);
        } catch (error) {
            console.log(`⚠️  Skipped ${update.id}: Product not found`);
        }
    }
    
    console.log('\n✅ Update complete!');
    await prisma.$disconnect();
}

updateProducts().catch((e) => {
    console.error(e);
    process.exit(1);
});
