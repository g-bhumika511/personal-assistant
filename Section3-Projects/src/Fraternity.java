import java.sql.SQLSyntaxErrorException;
import java.util.Scanner;

public class Fraternity {
    public static void main(String[] args) {
        Scanner keyboard=new Scanner(System.in);
        int age;
        char gender;

        System.out.println("enter your age: \t");
        age=keyboard.nextInt();

        System.out.println("Enter your gender(M/F):\t");
        gender=keyboard.next().charAt(0);

        if(age >= 19 && gender =='M')
        {
            System.out.println("you can join the fraternity.");
        }
        else {
            System.out.println("Sorry, you cannot join the fraternity.");
        }// end if-else
    }// end main
}
