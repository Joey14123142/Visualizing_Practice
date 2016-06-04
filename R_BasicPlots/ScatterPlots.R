##Basic scatter plots
## access data, mtcars is a built-in dataset
attach(mtcars)
## Plotting
## pch=17 refers to filled triangle, colored by number of cylinders
plot(hp, mpg, col=c(cyl), xlab = "Gross horsepower", ylab = "Miles/gallon", main = "Automobiles", pch=17)
## modify legend
legend("topright", cex=0.9, fill = c("blue", "pink", "grey"), legend=c("4 cylinders", "6 cylinders", "8 cylinders"))


##Scartter with texts, labels, lines
attach(cars)
plot(dist, speed, pch=0, xlim=c(0, max(cars$dist)), ylim=c(0,24), xlab="Distance", ylab="Speed", main="Speed and Stopping Distance of Cars")
## draw a vertical line
abline(v=(60), lwd=2, col="yellow")
## labels
text(60, 14, labels=c("Danger"), col="brown", cex = 0.8)


##scatter with a trend line applying LOESS
scatter.smooth(ChickWeight$Time, ChickWeight$weight, pch=1, lwd=0.6, col="Green", lpars = list(lty=6, col="Grey", lwd=2), xlab = "Age", ylab="Weight", main="Weight versus age of chicks")