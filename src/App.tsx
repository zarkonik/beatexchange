import { useNavigation } from "./context/NavigationContext";
import Header from "./components/Header/Header";
import UploadStem from "./components/UploadStem/UploadStem";
import Marketplace from "./components/Marketplace/Marketplace";
import Cart from "./components/Cart/Cart";
import PostService from "./components/PostService/PostService";
import AllServices from "./components/AllServices/AllServices";
import Admin from "./components/Admin/Admin";
import UsernameModal from "./components/UsernameModal/UsernameModal";
import MyStems from "./components/MyStems/MyStems";
import Profile from "./components/Profile/Profile";

function App() {
  const { currentPage } = useNavigation();

  return (
    <div>
      <Header />

      {/* Shows automatically on first wallet connect */}
      <UsernameModal />

      <main>
        {currentPage === "marketplace" && <Marketplace />}
        {currentPage === "upload" && <UploadStem />}
        {currentPage === "cart" && <Cart />}
        {currentPage === "services" && <AllServices />}
        {currentPage === "post-service" && <PostService />}
        {currentPage === "admin" && <Admin />}
        {currentPage === "mystems" && <MyStems />}
        {currentPage === "profile" && <Profile />}
      </main>
    </div>
  );
}

export default App;
