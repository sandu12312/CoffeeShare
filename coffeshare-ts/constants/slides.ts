import { useLanguage } from "../context/LanguageContext";

// Create a function that returns the slides with translations
export const useSlides = () => {
  const { t } = useLanguage();

  return [
    {
      id: 1,
      title: t("welcome"),
      description: t("subtitle"),
      image: require("../assets/images/firstWelcome.webp"),
    },
    {
      id: 2,
      title: t("smartSubscriptions"),
      description: t("smartSubscriptionsDesc"),
      image: require("../assets/images/Welcome2.jpg"),
    },
    {
      id: 3,
      title: t("easyAccess"),
      description: t("easyAccessDesc"),
      image: require("../assets/images/secondWelcome.jpg"),
    },
    {
      id: 4,
      title: t("findYourSpot"),
      description: t("findYourSpotDesc"),
      image: require("../assets/images/Welcome4.jpg"),
    },
    {
      id: 5,
      title: t("joinCommunity"),
      description: t("joinCommunityDesc"),
      image: require("../assets/images/Welcome5.jpg"),
    },
  ];
};

// For backward compatibility
export default useSlides;
