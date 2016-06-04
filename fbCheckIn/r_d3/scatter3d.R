# fb <- fread("train.csv", integer64="character", showProgress=TRUE)
# install.packages("dplyr")
# library(dplyr)
# fb %>% filter(x>1,x<1.25,y>2.5,y<2.75) ->fb2
# write.csv(fb2, file="fb2.csv")

library(dplyr)
fb2 <- read.csv("fb2.csv")
fb2 %>% count(place_id) %>% filter(n>500) -> id
subfb <- fb2[fb2$place_id %in% id$place_id,]

library(plotly)
subfb$hour <- (subfb$time/60) %% 24
plot_ly(data=subfb, 
        x=x, y=y, z=hour, 
        text=paste("Accuracy: ", accuracy),
        color=place_id, 
        type="scatter3d",
        mode="markers") %>% layout(title="Place_id's by Time(h) and Position with Accuracy")