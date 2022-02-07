public class ArrayFun {
    public static void main(String[] args)
    {
        int [] myArray;
        myArray =new int[5];

        myArray[0]=10;
        myArray[1]=34;
        myArray[2]=56;
        myArray[3]=67;
        myArray[4]=20;

        for(int i=0;i<myArray.length;i++)
        {
            System.out.println(myArray[i]);
        }
    }
}
