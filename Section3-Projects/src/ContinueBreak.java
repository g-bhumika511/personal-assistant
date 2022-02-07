

public class ContinueBreak {
    public static void main(String[] args)
    {
        int count=0;

        while(count<10)
        {
            if(count==5) {
                count++;
                break; //continue is used to skip that iteration
            }
                System.out.println(count+"\t");

                count++;
        }//end while

    }//end main
}
