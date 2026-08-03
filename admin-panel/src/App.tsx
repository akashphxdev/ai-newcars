import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminLayout from "./components/layout/AdminLayout";

// ── Page imports (apne actual pages se replace karo) ──────────────────────────
import Dashboard from "./pages/Dashboard";
import AllAdmins from "./pages/AdminUsers/AllAdmins/AllAdmins";
import AllUsers from "./pages/Users/AllUsers/AllUsers";
import AllNotifications from "./pages/Users/Notifications/AllNotifications";
import AllPermissions from "./pages/AdminUsers/Permission/AllPermissions";
import AllRoles from "./pages/AdminUsers/Roles/AllRoles";
import AllAdminLogs from "./pages/AdminUsers/AdminLogs/AllAdminLogs";
import AllSearchLogs from "./pages/Analytics/SearchLogs/AllSearchLogs";
import { AuthProvider } from "./context/AuthContext";
import AllCountries from "./pages/Locations/Countries/AllCountries";
import AllStates from "./pages/Locations/States/AllStates";
import AllCities from "./pages/Locations/Cities/AllCities";
import AllBrands from "./pages/newCars/Brands/AllBrands";
import AllCarModels from "./pages/newCars/carModels/AllCarModels";
import AllVariants from "./pages/newCars/Variants/AllVariants";
import AllPowertrainElectric from "./pages/newCars/PowertrainElectric/AllPowertrainElectric";
import AllPowertrainIce from "./pages/newCars/PowertrainIce/AllPowertrainIce";
import NotFound from "./pages/NotFound";
import AllColorsImages from "./pages/newCars/ColorsImages/AllColorsImages";
import AllFeatures from "./pages/newCars/Features/AllFeatures";
import AllFeatureCategories from "./pages/newCars/FeatureCategories/AllFeatureCategories";
import AllVariantFeatures from "./pages/newCars/VariantFeatures/AllVariantFeatures";
import AllFaqs from "./pages/newCars/Faqs/AllFaqs";
import AllOffers from "./pages/newCars/Offers/AllOffers";
import AllBodyTypes from "./pages/newCars/BodyTypes/AllBodyTypes";
import AllAttributeOptions from "./pages/newCars/AttributeOptions/AllAttributeOptions";
import AllArticleCategories from "./pages/Articles/ArticleCategories/AllArticleCategories";
import AllArticleComments from "./pages/Articles/ArticleComments/AllArticleComments";
import AllArticles from "./pages/Articles/Articles/AllArticles";
import AllReviews from "./pages/Reviews/AllReviews/AllReviews";
import AllNewCarLeads from "./pages/BuyLeads/NewCarLeads/AllNewCarLeads";
import AllInsuranceLeads from "./pages/BuyLeads/InsuranceLeads/AllInsuranceLeads";
import AllPriceDropLeads from "./pages/BuyLeads/PriceDropAlerts/AllPriceDropLeads";
import AllSoftLeads from "./pages/BuyLeads/SoftLeads/AllSoftLeads";
import AllLenders from "./pages/BuyLeads/Lenders/AllLenders";
import AllLoanLeads from "./pages/BuyLeads/LoanLeads/AllLoanLeads";
import UsedCarListings from "./pages/UsedCars/Listings";
import UsedCarInspections from "./pages/UsedCars/Inspections";
import AllSellLeads from "./pages/SellLeads/AllSellLeads";
import SellLeadActivities from "./pages/SellLeads/LeadActivities";
import AllStoryGroups from "./pages/Stories/StoryGroups/AllStoryGroups";
import AllStoryItems from "./pages/Stories/StoryItems/AllStoryItems";
import AllPlacements from "./pages/Ads/Placements/AllPlacements";
import AllAdvertisers from "./pages/Ads/Advertisers/AllAdvertisers";
import AllCampaigns from "./pages/Ads/Campaigns/AllCampaigns";
import AllImpressions from "./pages/Ads/Impressions/AllImpressions";
import AllClicks from "./pages/Ads/Clicks/AllClicks";
import AISettings from "./pages/Ai/Settings/Settings";
import AIDashboard from "./pages/Ai/Dashboard/Dashboard";
import AllAiFaqs from "./pages/Ai/Faqs/AllAiFaqs";
import AllAiLogs from "./pages/Ai/Logs/AllAiLogs";
import AllImagePool from "./pages/Ai/ImagePool/AllImagePool";
import AllAiSeos from "./pages/Ai/Seo/AllAiSeos";
import AllAiArticles from "./pages/Ai/Articles/AllAiArticles";
import AllAiStoryItems from "./pages/Ai/Stories/AllAiStoryItems";
import AllBanners from "./pages/Home/Banners/AllBanners";
import AllTestimonials from "./pages/Home/Testimonials/AllTestimonials";
import SiteSettings from "./pages/SiteSettings/SiteSettings";
// ── Auth guard — baad mein real auth logic lagao ──────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isLoggedIn = !!localStorage.getItem("admin_token"); // apna auth check yahan
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected admin routes */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="/home/banners" element={<AllBanners />} />
          <Route path="/home/testimonials" element={<AllTestimonials />} />

          <Route path="admins" element={<AllAdmins />} />
          <Route path="/users" element={<AllUsers />} />
          <Route path="/users/notifications" element={<AllNotifications />} />
          <Route path="roles" element={<AllRoles />} />
          <Route path="permissions" element={<AllPermissions />} />
          <Route path="adminlogs" element={<AllAdminLogs />} />
          
          <Route path="countries" element={<AllCountries />} />
          <Route path="states" element={<AllStates />} />
          <Route path="cities" element={<AllCities />} />

          <Route path ="/new-cars/brands" element={<AllBrands/>}/>
          <Route path ="/new-cars/models" element={<AllCarModels/>}/>
          <Route path ="/new-cars/variants" element={<AllVariants/>}/>
          <Route path ="/new-cars/powertrain-eletric" element={<AllPowertrainElectric/>}/>
          <Route path ="/new-cars/powertrain-ice" element={<AllPowertrainIce/>}/>
          <Route path ="/new-cars/colors" element={<AllColorsImages/>}/>
          <Route path ="/new-cars/feature-categories" element={<AllFeatureCategories/>}/>
          <Route path ="/new-cars/features" element={<AllFeatures/>}/>
          <Route path ="/new-cars/variant-features" element={<AllVariantFeatures/>}/>
          <Route path ="/new-cars/offers" element={<AllOffers/>}/>
          <Route path ="/new-cars/faqs" element={<AllFaqs/>}/>
          <Route path ="/new-cars/body-types" element={<AllBodyTypes/>}/>
          <Route path ="/new-cars/attribute-options" element={<AllAttributeOptions/>}/>

          <Route path ="/articles/category" element={<AllArticleCategories/>}/>
          <Route path ="/articles/all-articles" element={<AllArticles/>}/>
          <Route path ="/articles/article-comments" element={<AllArticleComments/>}/>
          <Route path ="/stories/story-groups" element={<AllStoryGroups/>}/>
          <Route path ="/stories/story-items" element={<AllStoryItems/>}/>
          <Route path ="/reviews/all-reviews" element={<AllReviews/>}/>

          <Route path="/leads/buy/new-cars" element={<AllNewCarLeads />} />
          <Route path="/leads/buy/insurance" element={<AllInsuranceLeads />} />
          <Route path="/leads/buy/price-drop" element={<AllPriceDropLeads />} />
          <Route path="/leads/buy/soft" element={<AllSoftLeads />} />
          <Route path="/partners/lenders" element={<AllLenders />} />
          <Route path="/leads/buy/loan" element={<AllLoanLeads />} />
          <Route path="/used-cars/listings" element={<UsedCarListings />} />
          <Route path="/used-cars/inspections" element={<UsedCarInspections />} />
          <Route path="/leads/sell" element={<AllSellLeads />} />
          <Route path="/leads/sell/activities" element={<SellLeadActivities />} />

          <Route path ="/ads/placements" element={<AllPlacements/>}/>
          <Route path ="/ads/advertisers" element={<AllAdvertisers/>}/>
          <Route path ="/ads/campaigns" element={<AllCampaigns/>}/>
          <Route path ="/ads/impressions" element={<AllImpressions/>}/>
          <Route path ="/ads/clicks" element={<AllClicks/>}/>

          <Route path="/analytics/search-logs" element={<AllSearchLogs />} />

          <Route path="/ai/dashboard" element={<AIDashboard />} />
          <Route path="/ai/car-faqs/review" element={<AllAiFaqs />} />
          <Route path="/ai/article/review" element={<AllAiArticles />} />
          <Route path="/ai/story/review" element={<AllAiStoryItems />} />
          <Route path ="/ai/seo/review" element={<AllAiSeos/>}/>
          <Route path="/ai/image-pool" element={<AllImagePool />} />
          <Route path ="/ai/logs" element={<AllAiLogs/>}/>
          <Route path ="/ai/settings" element={<AISettings/>}/>

          <Route path="/settings" element={<SiteSettings/>}/>
           
        </Route>

        {/* unknown path → NotFound */}
        <Route path ="*" element={<NotFound/>}/>
      </Routes>
    </BrowserRouter>
     </AuthProvider>
  );
}