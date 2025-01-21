export const ProductService = {
  getProductsData() {
    return [
      {
        id: "12dqwq1212",
        titleText: "PID Temperature Control",
        titleTextFontColour: "#000",
        subText: "Full Featured",
        subTextFontColour: "#FF0000",
        description: "Safe,Relaible & High Quality",
        descriptionFontColour: "#FF0000",
        videoUrl: "https://www.youtube.com/watch?v=x91MPoITQ3I",
        videoBtnFontColour: "#FF0000",
        ctaBtnText: "Play",
        ctaBtnTextFontColour: "#FF0000",
        ctaBtnUrl: "#",
        backgroundAssetUrl:
          "https://cdn.pixabay.com/photo/2019/11/29/09/46/garden-4660938_640.jpg",
        foregroundAssetUrl:
          "https://cdn.pixabay.com/photo/2019/11/29/09/46/garden-4660938_640.jpg",
      },
      {
        id: "12dqwq1213",
        titleText: "HIP Temperature Control 2",
        titleTextFontColour: "#000",
        subText: "Full Featured",
        subTextFontColour: "#FF0000",
        description: "Safe,Relaible & High Quality",
        descriptionFontColour: "#FF0000",
        videoUrl: "https://www.youtube.com/watch?v=x91MPoITQ3I",
        videoBtnFontColour: "#FF0000",
        ctaBtnText: "Play",
        ctaBtnTextFontColour: "#FF0000",
        ctaBtnUrl: "#",
        backgroundAssetUrl:
          "https://cdn.pixabay.com/photo/2019/11/29/09/46/garden-4660938_640.jpg",
        foregroundAssetUrl:
          "https://cdn.pixabay.com/photo/2019/11/29/09/46/garden-4660938_640.jpg",
      },
      {
        id: "12dqwq1214",
        titleText: "CID Temperature Control 3",
        titleTextFontColour: "#000",
        subText: "Full Featured",
        subTextFontColour: "#FF0000",
        description: "Safe,Relaible & High Quality",
        descriptionFontColour: "#FF0000",
        videoUrl: "https://www.youtube.com/watch?v=x91MPoITQ3I",
        videoBtnFontColour: "#FF0000",
        ctaBtnText: "Play",
        ctaBtnTextFontColour: "#FF0000",
        ctaBtnUrl: "#",
        backgroundAssetUrl:
          "https://cdn.pixabay.com/photo/2019/11/29/09/46/garden-4660938_640.jpg",
        foregroundAssetUrl:
          "https://cdn.pixabay.com/photo/2019/11/29/09/46/garden-4660938_640.jpg",
      },
      //   {
      //     id: '1002',
      //     name: 'EMS for RH, T and DP in Clean Room Area',
      //     image: 'bamboo-watch.jpg',
      //     date: "2024-07-03",
      //     price: 17500,
      //     quantity: 1,
      //     orderStatus: 'On The Way',
      //     slug: 'form-view'
      // },
    ];
  },
  getProductById(id: any){
    
      const filterbyId = this.getProductsData().filter((e: any) => e.id == id);
      return Promise.resolve(filterbyId[0]);

  },
  // getProductsMini() {
  //     return Promise.resolve(this.getProductsData().slice(0, 5));
  // },

  // getProductsSmall() {
  //     return Promise.resolve(this.getProductsData().slice(0, 10));
  // },

  getProducts() {
    return Promise.resolve(this.getProductsData());
  },
};
