import java.util.Scanner;

public class Proj2_2_MadLibsClone {
    public static void main(String[] args)
    {
        Scanner keyboard=new Scanner(System.in);

        String adjective1;
        String girlsName;
        String adjective2;
        String occupation1;
        String placeName;
        String clothing;
        String hobby;
        String adjective3;
        String occupation2;
        String boysName;
        String mansName;

        System.out.print("Enter an adjective:\t");
        adjective1=keyboard.nextLine();

        System.out.print("Enter a girl's name:\t");
        girlsName=keyboard.nextLine();

        System.out.print("Enter another adjective:\t");
        adjective2=keyboard.nextLine();

        System.out.print("Enter an occupation:\t");
        occupation1=keyboard.nextLine();

        System.out.print("Enter the name of the place:\t");
        placeName=keyboard.nextLine();

        System.out.print("Enter the name of the piece of the clothing\t");
        clothing=keyboard.nextLine();

        System.out.print("Enter the name of a hobby:\t");
        hobby=keyboard.nextLine();

        System.out.print("Enter another adjective:\t");
        adjective3=keyboard.nextLine();

        System.out.print("Enter another occupation:\t");
        occupation2=keyboard.nextLine();

        System.out.print("Enter a boy's name:\t");
        boysName=keyboard.nextLine();

        System.out.print("Enter a man's name:\t");
        mansName=keyboard.nextLine();

        System.out.println("There once was a "+adjective1+" girl named "+girlsName+" who was a "
        + adjective2+" "+occupation1+" in the Kingdom of "+placeName+".");

        System.out.print("she loved to wear "+clothing+" and is "+hobby+". she wanted to marry "
        +adjective3+" "+occupation2+" named "+boysName+" but her father, King"+mansName+" forbid her from seeing him.");;




    }
}
