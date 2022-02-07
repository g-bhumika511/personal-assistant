//3 categories of control statements
//sequential(Sequence)
//Selection(Decision)
//Repetition(Loops)
public class ControlStatementsIntro {
    public static void main(String[] args)
    {
        int age=19;

        if(age>=16) {
            System.out.println("you can drive!");
        }
        else{
            System.out.println("You cannot drive!");
        }//end if-else
        System.out.println(); //add some newline space

        for(int i=1;i<=age;i++)
        {
            System.out.println("Happy Birthday "+i);
        }//end for
    }//end main
}
