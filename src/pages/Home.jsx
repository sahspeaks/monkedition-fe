import React from "react";
import Hero from "../components/Hero";

import OurPolicy from "../components/OurPolicy";

import CollectionsCategory from "../components/CollectionsCategory";
import FeaturedProducts from "../components/FeaturedProducts";

function Home() {
  return (
    <div>
      <Hero />
      {/* <LatestCollections /> */}
      {/* <CollectionsView /> */}
      <FeaturedProducts />
      <CollectionsCategory />
      <OurPolicy />
    </div>
  );
}

export default Home;
