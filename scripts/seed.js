const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Manual env loading
try {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const index = trimmed.indexOf('=')
    if (index === -1) return
    const key = trimmed.substring(0, index).trim()
    const val = trimmed.substring(index + 1).trim()
    process.env[key] = val
  })
} catch (e) {
  console.error('No .env.local found')
}

let url = process.env.NEXT_PUBLIC_SUPABASE_URL
if (url && url.includes('/rest/v1')) {
  url = url.split('/rest/v1')[0]
}
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing Supabase environment credentials.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const CATEGORIES = [
  { name: 'Audio Gear', slug: 'audio' },
  { name: 'Mechanical Keyboards', slug: 'keyboards' },
  { name: 'Leather & Travel', slug: 'accessories' }
]

const PRODUCTS = [
  {
    name: 'Aura Stealth Wireless Headset',
    slug: 'aura-stealth-wireless-headset',
    description: 'Immersive sound with active noise cancellation and 40h battery life.',
    price_cents: 14900,
    sku: 'AUD-ASTH-01',
    stock_quantity: 15,
    category_slug: 'audio',
    image_urls: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60']
  },
  {
    name: 'Luminary Chrono Watch',
    slug: 'luminary-chrono-watch',
    description: 'Premium quartz chronograph watch with stainless steel strap and sapphire glass.',
    price_cents: 29900,
    sku: 'ACC-LCHW-02',
    stock_quantity: 2,
    category_slug: 'accessories',
    image_urls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60']
  },
  {
    name: 'Nexus Glass Mechanical Keyboard',
    slug: 'nexus-glass-mechanical-keyboard',
    description: 'Minimalist hot-swappable keyboard with clear acrylic body and custom RGB glow.',
    price_cents: 18900,
    sku: 'KEY-NXGL-03',
    stock_quantity: 8,
    category_slug: 'keyboards',
    image_urls: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60']
  },
  {
    name: 'Nomad Leather Backpack',
    slug: 'nomad-leather-backpack',
    description: 'Full-grain leather travel backpack with 16" protective laptop compartment.',
    price_cents: 22000,
    sku: 'ACC-NLBP-04',
    stock_quantity: 4,
    category_slug: 'accessories',
    image_urls: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60']
  },
  {
    name: 'Apex Wireless Earbuds',
    slug: 'apex-wireless-earbuds',
    description: 'Truly wireless earbuds with custom touch controls and sweat resistance.',
    price_cents: 9900,
    sku: 'AUD-APEX-05',
    stock_quantity: 25,
    category_slug: 'audio',
    image_urls: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60']
  },
  {
    name: 'Cipher Keycap Set',
    slug: 'cipher-keycap-set',
    description: 'Double-shot PBT keycaps with custom legend graphics and sleek dark theme.',
    price_cents: 4500,
    sku: 'KEY-CPHR-06',
    stock_quantity: 3,
    category_slug: 'keyboards',
    image_urls: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=60']
  },
  {
    name: 'Voyage Passport Wallet',
    slug: 'voyage-passport-wallet',
    description: 'Minimalist leather passport holder with slots for cards and boarding passes.',
    price_cents: 6500,
    sku: 'ACC-VYPW-07',
    stock_quantity: 30,
    category_slug: 'accessories',
    image_urls: ['https://images.unsplash.com/photo-1627124156297-9d42b28d94e1?w=500&auto=format&fit=crop&q=60']
  },
  {
    name: 'Soundscape Desk Speaker',
    slug: 'soundscape-desk-speaker',
    description: 'High-fidelity walnut wood desktop speaker with Bluetooth 5.2 connectivity.',
    price_cents: 12000,
    sku: 'AUD-SSDS-08',
    stock_quantity: 1,
    category_slug: 'audio',
    image_urls: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=60']
  },
  {
    name: 'Helix Coiled USB Cable',
    slug: 'helix-coiled-usb-cable',
    description: 'Paracord coiled aviator cable for high-end mechanical keyboards.',
    price_cents: 2900,
    sku: 'KEY-HLXC-09',
    stock_quantity: 40,
    category_slug: 'keyboards',
    image_urls: ['https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60']
  },
  {
    name: 'Meridian Leather Desk Mat',
    slug: 'meridian-leather-desk-mat',
    description: 'Premium vegan leather desk protector mat with non-slip backing.',
    price_cents: 8900,
    sku: 'ACC-MLDM-10',
    stock_quantity: 5,
    category_slug: 'accessories',
    image_urls: ['https://images.unsplash.com/photo-1632292224971-0d45778bd364?w=500&auto=format&fit=crop&q=60']
  },
  {
    name: 'Solis Solar Power Bank',
    slug: 'solis-solar-power-bank',
    description: 'Heavy duty 20000mAh backup battery with solar panels and flashlight.',
    price_cents: 5900,
    sku: 'ACC-SLPB-11',
    stock_quantity: 0,
    category_slug: 'accessories',
    image_urls: ['https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?w=500&auto=format&fit=crop&q=60']
  },
  {
    name: 'Titan Heavy Keyboard Case',
    slug: 'titan-heavy-keyboard-case',
    description: 'Solid aluminum carry case lined with high-density foam padding.',
    price_cents: 9500,
    sku: 'KEY-TTHC-12',
    stock_quantity: 1,
    category_slug: 'keyboards',
    image_urls: ['https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=500&auto=format&fit=crop&q=60']
  }
]

async function seed() {
  console.log('Seeding categories...')
  const categoryMap = {}
  
  for (const cat of CATEGORIES) {
    const { data, error } = await supabase
      .from('categories')
      .upsert({ name: cat.name, slug: cat.slug }, { onConflict: 'slug' })
      .select('id, slug')
      .single()

    if (error) {
      console.error(`Error seeding category ${cat.slug}:`, error)
    } else {
      console.log(`Seeded category: ${cat.name}`)
      categoryMap[cat.slug] = data.id
    }
  }

  console.log('Seeding products...')
  for (const prod of PRODUCTS) {
    const catId = categoryMap[prod.category_slug]
    if (!catId) {
      console.error(`Skipping product ${prod.slug}: category ID not found`)
      continue
    }

    const { error } = await supabase
      .from('products')
      .upsert({
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        price_cents: prod.price_cents,
        sku: prod.sku,
        stock_quantity: prod.stock_quantity,
        category_id: catId,
        image_urls: prod.image_urls
      }, { onConflict: 'sku' })

    if (error) {
      console.error(`Error seeding product ${prod.sku}:`, error)
    } else {
      console.log(`Seeded product: ${prod.name}`)
    }
  }

  console.log('Database seeding completed successfully.')
}

seed()
