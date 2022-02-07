import java.util.ArrayList;

public class ArrayListFun  {
    public static void main(String[] args) {
        ArrayList<String> namesList;
        namesList=new ArrayList<>();

        //ArrayList<int> myNumList=new ArrayList<int>();

        namesList.add("John");
        namesList.add("Kyle");
        namesList.add("Matthew");
        namesList.add("Amanda");
        namesList.add("Wendy");

//        for(int i=0;i<namesList.size();i++)
//        {
//            System.out.println(namesList.get(i));
//        }

        for(String name: namesList) {
            System.out.println(name);
        }
    }
}
