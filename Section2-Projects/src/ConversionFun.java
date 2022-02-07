
public class ConversionFun {
    public static void main(String[] args)
    {
        double myDouble=3.14;
        float myfloat=3.14f;//narrowing/lossy conversion
        double yourDouble=myfloat; //widening/lossless conversion
        byte myByte=12;
        short myShort=13;
        int myInt=465;
        long myLong=7l;
        char myChar='b';
        boolean myBoolean=false;

        System.out.println("Byte: "+myByte+"\nShort: "+myShort+"\nint: "+myInt+"\nlong: "+myLong);
        System.out.println("float: "+myfloat+"\ndouble: "+myDouble+"\nchar: "+myChar+"\nboolean: "+myBoolean);




    }//end main
}
