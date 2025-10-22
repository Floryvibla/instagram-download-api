import { getProfile, getProfissionalExperiences } from "./account";
import { getCommentsByPostUrl } from "./posts";

getCommentsByPostUrl(
  "https://www.linkedin.com/posts/vitorbaesso_enquanto-voc%C3%AA-leva-6-meses-para-estruturar-activity-7361003541743726593-84ew?utm_source=share&utm_medium=member_desktop&rcm=ACoAABgQ7uMBHhkeqe_cSk1_5fNcRa3Q1TZ8j0k"
)
  .then((comments) => {
    console.log("comments: ", comments);
  })
  .catch((error) => {
    console.log("error: ", error);
  });
