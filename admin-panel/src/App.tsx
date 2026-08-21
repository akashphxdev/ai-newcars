import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminLayout from "./components/layout/AdminLayout";

// ── Page imports (apne actual pages se replace karo) ──────────────────────────
import Dashboard from "./pages/Dashboard/Dashboard";
import AllAdmins from "./pages/AdminUsers/AllAdmins/AllAdmins";
import AllUsers from "./pages/Users/AllUsers/AllUsers";
import AllPermissions from "./pages/AdminUsers/Permission/AllPermissions";
import AllRoles from "./pages/AdminUsers/Roles/AllRoles";
import AllAdminLogs from "./pages/AdminUsers/AdminLogs/AllAdminLogs";
import AllSearchLogs from "./pages/Analytics/SearchLogs/AllSearchLogs";
import AllPageViews from "./pages/Analytics/PageViews/AllPageViews";
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
import AllArticles from "./pages/Articles/Articles/AllArticles";
import AllReviews from "./pages/Reviews/AllReviews/AllReviews";
import AllNewCarLeads from "./pages/BuyLeads/NewCarLeads/AllNewCarLeads";
import AllInsuranceLeads from "./pages/BuyLeads/InsuranceLeads/AllInsuranceLeads";
import AllPriceDropLeads from "./pages/BuyLeads/PriceDropAlerts/AllPriceDropLeads";
import AllSoftLeads from "./pages/BuyLeads/SoftLeads/AllSoftLeads";
import AllLenders from "./pages/BuyLeads/Lenders/AllLenders";
import AllLoanLeads from "./pages/BuyLeads/LoanLeads/AllLoanLeads";
import AllLaunchNotifyLeads from "./pages/BuyLeads/LaunchNotify/AllLaunchNotifyLeads";
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
import AllBanners from "./pages/Home/Banners/AllBanners";
import AllTestimonials from "./pages/Home/Testimonials/AllTestimonials";
import SiteSettings from "./pages/SiteSettings/SiteSettings";
import AllSeoMetas from "./pages/Seo/SeoMeta/AllSeoMetas";
import AllSeoRedirects from "./pages/Seo/SeoRedirects/AllSeoRedirects";
import AllCodexBrands from "./pages/Codex/Brands/AllCodexBrands";
import AllCodexCarModels from "./pages/Codex/CarModels/AllCodexCarModels";
import AllCodexCarVariants from "./pages/Codex/CarVariants/AllCodexCarVariants";
import AllCodexPowertrainIce from "./pages/Codex/PowertrainIce/AllCodexPowertrainIce";
import AllCodexPowertrainElectric from "./pages/Codex/PowertrainElectric/AllCodexPowertrainElectric";
import AllCodexFeatureCategories from "./pages/Codex/FeatureCategories/AllCodexFeatureCategories";
import AllCodexFeatures from "./pages/Codex/Features/AllCodexFeatures";
import AllCodexVariantFeatures from "./pages/Codex/VariantFeatures/AllCodexVariantFeatures";
import AllCodexCarColors from "./pages/Codex/CarColors/AllCodexCarColors";
import AllCodexColorShades from "./pages/Codex/ColorShades/AllCodexColorShades";
import AllCodexCarImages from "./pages/Codex/CarImages/AllCodexCarImages";
import AllCodexArticles from "./pages/Codex/Articles/AllCodexArticles";
import AllCodexArticleBrands from "./pages/Codex/ArticleBrands/AllCodexArticleBrands";
import AllCodexArticleCarModels from "./pages/Codex/ArticleCarModels/AllCodexArticleCarModels";
import AllCodexCarFaqs from "./pages/Codex/CarFaqs/AllCodexCarFaqs";
import AllCodexVariantPriceChanges from "./pages/Codex/VariantPriceChanges/AllCodexVariantPriceChanges";
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
          <Route path ="/stories/story-groups" element={<AllStoryGroups/>}/>
          <Route path ="/stories/story-items" element={<AllStoryItems/>}/>
          <Route path ="/reviews/all-reviews" element={<AllReviews/>}/>

          <Route path="/leads/buy/new-cars" element={<AllNewCarLeads />} />
          <Route path="/leads/buy/insurance" element={<AllInsuranceLeads />} />
          <Route path="/leads/buy/price-drop" element={<AllPriceDropLeads />} />
          <Route path="/leads/buy/launch-notify" element={<AllLaunchNotifyLeads />} />
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

          <Route path="/seo/meta" element={<AllSeoMetas />} />
          <Route path="/seo/redirects" element={<AllSeoRedirects />} />

          <Route path="/analytics/search-logs" element={<AllSearchLogs />} />
          <Route path="/analytics/page-views" element={<AllPageViews />} />

          <Route path="/settings" element={<SiteSettings/>}/>
          <Route path="/codex/approvals" element={<Navigate to="/codex/brands" replace />} />
          <Route path="/codex/brands" element={<AllCodexBrands />} />
          <Route path="/codex/models" element={<AllCodexCarModels />} />
          <Route path="/codex/variants" element={<AllCodexCarVariants />} />
          <Route path="/codex/powertrains-ice" element={<AllCodexPowertrainIce />} />
          <Route path="/codex/powertrains-electric" element={<AllCodexPowertrainElectric />} />
          <Route path="/codex/feature-categories" element={<AllCodexFeatureCategories />} />
          <Route path="/codex/features" element={<AllCodexFeatures />} />
          <Route path="/codex/variant-features" element={<AllCodexVariantFeatures />} />
          <Route path="/codex/colors" element={<AllCodexCarColors />} />
          <Route path="/codex/color-shades" element={<AllCodexColorShades />} />
          <Route path="/codex/images" element={<AllCodexCarImages />} />
          <Route path="/codex/articles" element={<AllCodexArticles />} />
          <Route path="/codex/article-brands" element={<AllCodexArticleBrands />} />
          <Route path="/codex/article-models" element={<AllCodexArticleCarModels />} />
          <Route path="/codex/faqs" element={<AllCodexCarFaqs />} />
          <Route path="/codex/variant-price-changes" element={<AllCodexVariantPriceChanges />} />
           
        </Route>

        {/* unknown path → NotFound */}
        <Route path ="*" element={<NotFound/>}/>
      </Routes>
    </BrowserRouter>
     </AuthProvider>
  );
}
