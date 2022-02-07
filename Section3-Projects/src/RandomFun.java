import java.util.Random;

public class RandomFun {
    public static void main(String[] args)
    {
        //random range -2,147,483,248 to 2,147,483,647
        Random random=new Random();
        int myRandomNumber;

        myRandomNumber=random.nextInt();
        System.out.println("number is \t"+myRandomNumber);

        myRandomNumber=random.nextInt(1000);//0-999
        System.out.println("0 through 000?\t"+myRandomNumber);

        //shifting
        myRandomNumber =random.nextInt(1000)+1;
        System.out.println("0 through 000?\t"+myRandomNumber);




    }//end main
}
