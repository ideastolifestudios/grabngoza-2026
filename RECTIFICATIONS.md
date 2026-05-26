# ============================================================
#  Grab & Go ZA — 7 Rectifications
#  Each block: FIND this exact string → REPLACE with the block below
#  File location noted per patch.
# ============================================================


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RECT 1 — Remove double logo on login (auth drawer, ~L3372)
# File: src/App.tsx  (or wherever your auth drawer lives)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# REMOVE this line (the one you added above the form):
<Logo className="h-8 mb-2" dark />


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RECT 2 — Cart icon → live item count badge (~L900-908)
# File: src/App.tsx  (or Header component)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# FIND:
<button onClick={openCart} className="relative">
  <ShoppingCart size={22} />
  {cartCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
      {cartCount}
    </span>
  )}
</button>

# REPLACE WITH:
<button onClick={openCart} className="relative">
  {cartCount > 0 ? (
    <span className="w-7 h-7 bg-[#06402B] text-white text-sm font-semibold rounded-full flex items-center justify-center">
      {cartCount}
    </span>
  ) : (
    <ShoppingCart size={22} />
  )}
</button>


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RECT 3 — FreeDeliveryBar needs cartTotal (Rands, not count)
# File: src/App.tsx  (AppContent component)
# Two changes needed: prop thread + component usage
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# CHANGE 1 — derive cartTotal alongside cartCount (in AppContent):
# FIND:
const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

# REPLACE WITH:
const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

# CHANGE 2 — pass cartTotal to Header:
# FIND:
<Header cartCount={cartCount}

# REPLACE WITH:
<Header cartCount={cartCount} cartTotal={cartTotal}

# CHANGE 3 — add cartTotal prop to Header component props type:
# FIND (in Header.tsx or wherever Header is defined):
type HeaderProps = {
  cartCount: number;

# REPLACE WITH:
type HeaderProps = {
  cartCount: number;
  cartTotal: number;

# CHANGE 4 — pass cartTotal into FreeDeliveryBar:
# FIND (inside Header render):
<FreeDeliveryBar cartCount={cartCount}

# REPLACE WITH:
<FreeDeliveryBar amount={cartTotal}

# CHANGE 5 — update FreeDeliveryBar to use amount (Rands):
# In FreeDeliveryBar component — replace cartCount-based logic with:
const FREE_DELIVERY_THRESHOLD = 500;
const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - amount);
const progress  = Math.min(100, (amount / FREE_DELIVERY_THRESHOLD) * 100);
# Then in JSX use `remaining` and `progress` instead of cartCount-based calc


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RECT 4 — Spread #06402B brand colour to 5 elements
# Files: Header, Footer, product cards, CTAs, category headers
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 4a — Header border (Header.tsx):
# FIND (header element border):
border-b border-gray-100
# REPLACE WITH:
border-b border-[#06402B]/20

# 4b — Footer background accent (Footer.tsx):
# FIND (footer top bar / accent strip):
bg-gray-900
# REPLACE WITH:
bg-[#06402B]

# 4c — Primary CTA buttons (any "Add to cart" / "Buy now"):
# FIND:
className="... bg-black text-white ...
# REPLACE WITH:
className="... bg-[#06402B] text-white ...

# 4d — Product card hover state (ProductCard.tsx):
# FIND:
hover:border-gray-300
# REPLACE WITH:
hover:border-[#06402B]/40

# 4e — Category page header (CategoryPage.tsx or similar):
# FIND (category hero/header section bg):
bg-gray-100
# REPLACE WITH:
bg-[#06402B]/8


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RECT 5 — Hero autoplay (useEffect + setInterval)
# File: wherever your Hero/HeroSlider component lives
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ADD this useEffect inside the Hero component (after existing state):

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  }, 4000);
  return () => clearInterval(timer);
}, [slides.length]);

# If the hero already has a manual setCurrentSlide handler,
# pause autoplay on hover by adding:

const [paused, setPaused] = useState(false);

useEffect(() => {
  if (paused) return;
  const timer = setInterval(() => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  }, 4000);
  return () => clearInterval(timer);
}, [slides.length, paused]);

# Then on the hero container div:
# ADD:  onMouseEnter={() => setPaused(true)}
#       onMouseLeave={() => setPaused(false)}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RECT 6 — Consistent label colours
# Files: any component using product/category labels
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Rule: Sale / Discount labels → bg-[#FFA500] text-white
#       New / Drop labels      → bg-[#06402B] text-white
#       Bundle labels          → bg-black text-white

# FIND sale labels:
className="... bg-red-500 ...
# REPLACE WITH:
className="... bg-[#FFA500] ...

# FIND "New" / "Drop" labels:
className="... bg-blue-600 ...   (or whatever colour is currently used)
# REPLACE WITH:
className="... bg-[#06402B] ...


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RECT 7 — Nav scroll hide (already handled by motion.header)
# No code change needed — confirmed working.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Nothing to do here. ✅
