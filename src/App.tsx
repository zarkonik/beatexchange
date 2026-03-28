import { useNavigation } from "./context/NavigationContext";
import Header from "./components/Header/Header";
import UploadStem from "./components/UploadStem/UploadStem";
import Marketplace from "./components/Marketplace/Marketplace";
import Cart from "./components/Cart/Cart";

function App() {
  const { currentPage } = useNavigation();

  return (
    <div>
      <Header />
      <main>
        {currentPage === "marketplace" && (
          <p style={{ padding: "40px", color: "#666" }}>
            Marketplace coming soon...
          </p>
        )}
        {currentPage === "marketplace" && <Marketplace />}
        {currentPage === "upload" && <UploadStem />}
        {currentPage === "mystems" && (
          <p style={{ padding: "40px", color: "#666" }}>
            My Stems coming soon...
          </p>
        )}
        {currentPage === "cart" && <Cart />}
      </main>
    </div>
  );
}

export default App;
