import { useNavigation } from "./context/NavigationContext";
import Header from "./components/Header/Header";
import UploadStem from "./components/UploadStem/UploadStem";
import Marketplace from "./components/Marketplace/Marketplace";
import Cart from "./components/Cart/Cart";
import PostService from "./components/PostService/PostService";
import AllServices from "./components/AllServices/AllServices";

function App() {
  const { currentPage } = useNavigation();

  return (
    <div>
      <Header />
      <main>
        {currentPage === "marketplace" && <Marketplace />}
        {currentPage === "upload" && <UploadStem />}
        {currentPage === "cart" && <Cart />}
        {currentPage === "services" && <AllServices />}
        {currentPage === "post-service" && <PostService />}
      </main>
    </div>
  );
}

export default App;
