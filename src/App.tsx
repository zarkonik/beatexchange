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
import UploadPack from "./components/UploadPack/UploadPack";
import Landing from "./components/Landing/Landing";
import Forum from "./components/Forum/Forum";
import { useUser } from "./context/UserContext";

function App() {
  const { currentPage } = useNavigation();
  const { showUsernameModal } = useUser();
  return (
    <div>
      <Header />

      {showUsernameModal && <UsernameModal />}

      <main>
        {currentPage === "home" && <Landing />}
        {currentPage === "marketplace" && <Marketplace />}
        {currentPage === "upload" && <UploadStem />}
        {currentPage === "cart" && <Cart />}
        {currentPage === "services" && <AllServices />}
        {currentPage === "post-service" && <PostService />}
        {currentPage === "admin" && <Admin />}
        {currentPage === "mystems" && <MyStems />}
        {currentPage === "profile" && <Profile />}
        {currentPage === "upload-pack" && <UploadPack />}
        {currentPage === "forum" && <Forum />}
      </main>
    </div>
  );
}

export default App;
