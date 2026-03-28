import { useNavigation } from "./context/NavigationContext";
import Header from "./components/Header/Header";
import UploadStem from "./components/UploadStem/UploadStem";

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
        {currentPage === "upload" && <UploadStem />}
        {currentPage === "mystems" && (
          <p style={{ padding: "40px", color: "#666" }}>
            My Stems coming soon...
          </p>
        )}
      </main>
    </div>
  );
}

export default App;
